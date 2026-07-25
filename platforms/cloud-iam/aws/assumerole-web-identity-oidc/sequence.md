---
title: "AssumeRoleWithWebIdentity — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AssumeRoleWithWebIdentity — Sequence Diagram

Happy path first: a GitHub Actions job mints an OIDC token and exchanges it for AWS
credentials. Then alternates: missing `aud` condition, over-broad `sub`, expired token,
and an unregistered issuer.

```mermaid
sequenceDiagram
    autonumber
    participant Job as Workload (GitHub Actions job)
    participant IdP as OIDC IdP (GitHub)
    participant STS as STS
    participant IAM as IAM (OIDC provider + trust policy)
    participant API as Target API

    Job->>IdP: Request OIDC token<br/>(id-token: write permission)
    IdP-->>Job: Signed JWT<br/>(iss, aud=sts.amazonaws.com,<br/>sub=repo:org/repo:ref:refs/heads/main)
    Job->>STS: AssumeRoleWithWebIdentity(RoleArn,<br/>RoleSessionName, WebIdentityToken=JWT)

    STS->>IdP: Fetch JWKS (cached) to verify JWT signature
    IdP-->>STS: Public keys
    STS->>STS: Verify signature, iss, exp
    STS->>IAM: iss registered as IAM OIDC provider?<br/>aud in ClientIDList?
    IAM-->>STS: Yes
    STS->>IAM: Evaluate role trust policy conditions<br/>(...:aud and ...:sub claims)
    IAM-->>STS: Allow

    STS-->>Job: Temporary credentials<br/>{AccessKeyId, SecretAccessKey, SessionToken}
    Job->>API: SigV4 request with temp creds
    API-->>Job: 200 deploy proceeds

    alt Trust policy missing aud condition
        Note over IAM: Only sub is checked, or neither.<br/>Any GitHub repo's token could match iss alone.
        STS->>IAM: Evaluate (aud unchecked)
        IAM-->>STS: Allow (dangerously broad)
        STS-->>Job: Credentials issued to an untrusted caller
    end

    alt sub too broad (repo:org/*)
        Job->>STS: AssumeRoleWithWebIdentity from a fork/other branch
        STS->>IAM: sub StringLike repo:org/* matches
        IAM-->>STS: Allow (unintended)
        STS-->>Job: Credentials leak to wrong workflow
    end

    alt Expired or tampered JWT
        Job->>STS: AssumeRoleWithWebIdentity(WebIdentityToken=stale JWT)
        STS->>STS: exp passed or signature invalid
        STS-->>Job: 400 InvalidIdentityToken
    end

    alt Issuer not registered in IAM
        Job->>STS: AssumeRoleWithWebIdentity from unknown issuer
        STS->>IAM: iss has no IAM OIDC provider
        IAM-->>STS: No match
        STS-->>Job: AccessDenied (not authorized to assume role)
    end
```

Notes

- The `AssumeRoleWithWebIdentity` call itself is **unsigned**; the JWT is the sole proof of
  identity, so trust-policy claim conditions are the security boundary.
- For GitHub, `aud` defaults to `sts.amazonaws.com` when using
  `aws-actions/configure-aws-credentials`; pin it with `StringEquals`.
- The "missing aud" and "broad sub" alternates are shown as they actually behave —
  succeeding — precisely because they are the dangerous misconfigurations to avoid.
