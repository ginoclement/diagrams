---
title: "Workload Identity Federation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Identity Federation — Sequence Diagram

Happy path first (GitHub Actions OIDC token exchanged then SA impersonation), then alternates:
attribute-condition rejection, AWS subject token, and direct resource access without impersonation.

```mermaid
sequenceDiagram
    autonumber
    participant Workload as Workload (CI job)
    participant ExtIdP as External IdP
    participant STS as Google STS
    participant Pool as Pool + Provider
    participant IAMCreds as IAM Credentials API
    participant TargetSA as Target SA

    Workload->>ExtIdP: Request OIDC ID token<br/>(audience = Google WIF provider)
    ExtIdP-->>Workload: Signed JWT (sub, repository, ref claims)
    Workload->>STS: POST /v1/token grant_type=token-exchange<br/>subject_token = JWT, audience = pool provider
    STS->>Pool: Validate issuer, audience, signature (JWKS),<br/>evaluate attribute_condition + attribute mapping
    Pool-->>STS: OK, principal =<br/>principalSet://.../attribute.repository/ORG/REPO

    alt Federated token then impersonation (happy path)
        STS-->>Workload: Federated access token (short-lived)
        Workload->>IAMCreds: generateAccessToken(target SA)<br/>with federated token
        IAMCreds->>IAMCreds: principalSet has Token Creator on target SA?
        IAMCreds-->>Workload: Target SA access token
        Workload->>TargetSA: Call Google APIs as target SA
    else Attribute condition rejects the token
        Pool-->>STS: Denied - repo/branch not allowed
        STS-->>Workload: 400 invalid_grant / unauthorized_client
    else AWS provider variant
        Workload->>STS: subject_token = signed GetCallerIdentity request,<br/>subject_token_type = aws4_request
        STS->>Pool: Verify AWS signature, map account/role to attributes
        Pool-->>STS: OK, principalSet by AWS role ARN
        STS-->>Workload: Federated access token
    else Direct resource access (no impersonation)
        STS-->>Workload: Federated access token
        Workload->>TargetSA: Call resource where principalSet://<br/>is granted a role directly
    end
```

Notes

- The audience the external IdP mints into the token must equal the WIF provider's expected
  audience; a mismatch fails validation at the Pool.
- The two-leg pattern (federate → impersonate) is most common because many APIs and quota still
  key on a service account identity; direct `principalSet://` grants skip the second leg.
- No downloadable key is ever involved — the only long-lived trust is the provider's issuer +
  attribute-condition configuration.
