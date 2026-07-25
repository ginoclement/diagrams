---
title: "Cross-Account Role Assumption — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cross-Account Role Assumption — Sequence Diagram

Happy path first (a principal in account A assumes a role in account B and calls an account-B
API), then alternates: third-party `ExternalId`, org-scoped trust, and role chaining.

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Caller (account A)
    participant STS as STS
    participant TrustB as Trust policy (account B)
    participant RoleB as Role (account B)
    participant API as API (account B)

    Caller->>STS: AssumeRole(RoleArn=arn:aws:iam::B:role/App,<br/>RoleSessionName)
    STS->>STS: Caller identity policy allows<br/>sts:AssumeRole on RoleArn? yes
    STS->>TrustB: Principal names account A? conditions met?
    TrustB-->>STS: Allow
    STS->>RoleB: Bound session to role permissions<br/>+ MaxSessionDuration
    STS-->>Caller: Credentials {AccessKeyId, SecretAccessKey,<br/>SessionToken, Expiration}<br/>+ assumed-role ARN in account B

    Caller->>API: SigV4-signed request with temp creds<br/>(X-Amz-Security-Token)
    API-->>Caller: 200 result (CloudTrail logs RoleSessionName)

    alt Third-party vendor role (confused-deputy defense)
        Caller->>STS: AssumeRole(RoleArn, ExternalId=customer-secret)
        STS->>TrustB: sts:ExternalId equals expected value?
        alt ExternalId matches
            TrustB-->>STS: Allow
            STS-->>Caller: Temporary credentials
        else Missing or wrong ExternalId
            TrustB-->>STS: Deny
            STS-->>Caller: AccessDenied (confused-deputy blocked)
        end
    end

    alt Org-scoped trust
        Caller->>STS: AssumeRole(RoleArn)
        STS->>TrustB: Condition aws:PrincipalOrgID equals o-abc123?
        alt Caller is in the trusted org
            TrustB-->>STS: Allow
            STS-->>Caller: Temporary credentials
        else Different org
            TrustB-->>STS: Deny
            STS-->>Caller: AccessDenied
        end
    end

    opt Role chaining into a third account
        Caller->>STS: AssumeRole in account C<br/>using account-B assumed-role creds
        Note over Caller,STS: Chaining caps DurationSeconds at 3600,<br/>each hop is a fresh trust evaluation.
        STS-->>Caller: Credentials valid up to 1 hour
    end
```

Notes

- Naming account A as `:root` in the trust policy delegates the account-B gate to account A's
  own IAM, the caller still needs the `sts:AssumeRole` identity policy.
- `ExternalId` defeats the confused deputy, it is set by the resource owner and unique per
  customer, never guessable or shared.
- CloudTrail in account B records `RoleSessionName` and the source account for the audit trail.
