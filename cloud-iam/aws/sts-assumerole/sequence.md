# STS AssumeRole — Sequence Diagram

Happy path first (a caller assumes a role and calls an API with the temporary
credentials), then alternates: MFA-required role, `ExternalId` mismatch, session-policy
narrowing, and a duration that exceeds `MaxSessionDuration`.

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Caller (IAM user/role)
    participant STS as STS
    participant IAM as IAM (policy engine)
    participant API as Target API

    Caller->>STS: AssumeRole(RoleArn, RoleSessionName,<br/>DurationSeconds)
    STS->>IAM: Evaluate caller identity policy<br/>(sts:AssumeRole on RoleArn?)
    IAM-->>STS: Allow
    STS->>IAM: Evaluate role trust policy<br/>(Principal matches caller? conditions met?)
    IAM-->>STS: Allow

    STS->>STS: Mint temporary credentials scoped to role<br/>(intersect with any session policy)
    STS-->>Caller: Credentials {AccessKeyId, SecretAccessKey,<br/>SessionToken, Expiration}<br/>+ AssumedRoleUser ARN

    Caller->>API: SigV4-signed request with temp creds<br/>(X-Amz-Security-Token header)
    API->>IAM: Authorize action against role permissions
    IAM-->>API: Allow
    API-->>Caller: 200 result

    alt Role requires MFA (trust policy: aws:MultiFactorAuthPresent=true)
        Caller->>STS: AssumeRole(..., SerialNumber, TokenCode)
        STS->>IAM: Trust policy condition aws:MultiFactorAuthPresent
        alt TokenCode valid
            IAM-->>STS: Allow
            STS-->>Caller: Temporary credentials
        else Missing or bad TokenCode
            IAM-->>STS: Deny (condition unmet)
            STS-->>Caller: AccessDenied
        end
    end

    alt Third-party role with ExternalId
        Caller->>STS: AssumeRole(RoleArn, ExternalId)
        STS->>IAM: Trust condition sts:ExternalId equals expected?
        alt ExternalId matches
            IAM-->>STS: Allow
            STS-->>Caller: Temporary credentials
        else ExternalId missing or wrong
            IAM-->>STS: Deny
            STS-->>Caller: AccessDenied (confused-deputy defense)
        end
    end

    opt Session policy narrows permissions
        Caller->>STS: AssumeRole(..., Policy/PolicyArns)
        STS->>STS: Effective perms = role policy INTERSECT session policy
        STS-->>Caller: Credentials limited to the intersection
    end

    alt DurationSeconds > role MaxSessionDuration
        Caller->>STS: AssumeRole(..., DurationSeconds=43200)
        STS-->>Caller: ValidationError<br/>(requested duration exceeds MaxSessionDuration)
    end
```

Notes

- Both gates (steps 2-3 and 4-5) must return Allow; either deny fails the whole call.
- The temporary credentials carry a `SessionToken` sent as `X-Amz-Security-Token`; without
  it SigV4 verification fails for temporary credentials.
- Role chaining (assuming a role using already-assumed-role credentials) silently caps
  `DurationSeconds` at 3600.
