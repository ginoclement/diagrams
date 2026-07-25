---
title: "Entra Workload Identity Federation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Entra Workload Identity Federation — Sequence Diagram

Happy path first (a GitHub Actions job mints an OIDC token and exchanges it for an Entra access
token), then alternates: another cloud as the issuer, a subject mismatch, and an audience
mismatch.

```mermaid
sequenceDiagram
    autonumber
    participant Workload as Workload (GitHub Actions)
    participant ExtIdP as External OIDC issuer
    participant Entra as Entra token endpoint
    participant API as Protected API

    Workload->>ExtIdP: Request OIDC token<br/>(aud=api://AzureADTokenExchange)
    ExtIdP-->>Workload: Signed JWT<br/>iss=token.actions.githubusercontent.com,<br/>sub=repo:org/repo:ref:refs/heads/main
    Workload->>Entra: POST /oauth2/v2.0/token<br/>grant_type=client_credentials, client_id,<br/>scope=<resource>/.default,<br/>client_assertion_type=jwt-bearer,<br/>client_assertion=<external JWT>
    Entra->>ExtIdP: Fetch OIDC discovery + JWKS
    ExtIdP-->>Entra: Signing keys
    Entra->>Entra: Verify signature, match federated credential<br/>iss + sub + aud exactly
    Entra-->>Workload: access_token (JWT), expires_in
    Workload->>API: Call API with Bearer token
    API-->>Workload: 200 result

    alt Another cloud as issuer
        Workload->>ExtIdP: Get workload OIDC token from that cloud
        ExtIdP-->>Workload: Signed JWT (that cloud's iss/sub)
        Workload->>Entra: Exchange assertion (same grant)
        Entra-->>Workload: access_token (if credential matches)
    end

    alt Subject mismatch (wrong branch/environment)
        Workload->>Entra: Assertion with sub=...ref:refs/heads/dev
        Entra->>Entra: sub does not match pinned subject
        Entra-->>Workload: 400 AADSTS700213 no matching<br/>federated identity record
    end

    alt Audience mismatch
        Workload->>Entra: Assertion aud != api://AzureADTokenExchange
        Entra-->>Workload: 400 invalid assertion audience
    end
```

Notes

- No client secret is stored in Entra, trust rests entirely on the pinned `iss`/`sub`/`aud` and
  the external issuer's signing keys fetched from its JWKS.
- The external assertion is short-lived, Entra still issues its own standard access token bound to
  the app's permissions.
- Subject matching is exact, a different branch, tag, or environment yields a different `sub` and
  is rejected.
