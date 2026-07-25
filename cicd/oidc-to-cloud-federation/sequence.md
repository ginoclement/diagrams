# OIDC to Cloud Federation — Sequence Diagram

Happy path first (GitHub Actions → AWS `AssumeRoleWithWebIdentity`), then the GCP and Azure
variants, and the rejection alternates: misconfigured wildcard subject, audience mismatch,
expired credentials, and the ⛔ deprecated stored-key branch.

```mermaid
sequenceDiagram
    autonumber
    participant Job as CI Job
    participant OIDC as CI OIDC issuer
    participant STS as AWS STS
    participant Cloud as Cloud APIs

    Job->>OIDC: Request OIDC token<br/>aud = sts.amazonaws.com
    OIDC->>OIDC: Sign JWT with workflow claims<br/>sub = repo:org/repo:ref:refs/heads/main, actor, environment
    OIDC-->>Job: Signed JWT (id token, short-lived)
    Job->>STS: AssumeRoleWithWebIdentity<br/>RoleArn + WebIdentityToken = JWT
    STS->>OIDC: Fetch JWKS, verify JWT signature
    STS->>STS: Check trust policy<br/>sub condition + aud condition
    STS-->>Job: Temporary credentials<br/>AccessKeyId, SecretAccessKey, SessionToken (TTL ~1h)
    Job->>Cloud: Deploy using temporary credentials
    Cloud-->>Job: 200 deployed

    alt GCP Workload Identity Federation
        Job->>OIDC: Request OIDC token (aud = WIF provider audience)
        OIDC-->>Job: Signed JWT
        Job->>STS: GCP STS token exchange (JWT)
        STS->>STS: Verify signature + attribute conditions
        STS-->>Job: Federated access token
        Job->>STS: Impersonate service account (optional)
        STS-->>Job: Scoped SA access token
    end

    alt Azure workload identity federation
        Job->>OIDC: Request OIDC token (aud = api://AzureADTokenExchange)
        OIDC-->>Job: Signed JWT
        Job->>STS: Entra ID token request (client_assertion = JWT)
        STS->>STS: Match federated credential (issuer + subject)
        STS-->>Job: Entra ID access token
    end

    alt Misconfigured trust: wildcard subject (danger)
        Note over Job,STS: Trust policy allows sub = repo:org/*<br/>A fork or unrelated repo mints a valid JWT.
        Job->>STS: AssumeRoleWithWebIdentity from fork repo
        STS->>STS: sub matches the wildcard - accepted (bad)
        STS-->>Job: Temporary credentials leaked to fork
        Note over STS,Cloud: Fix: pin sub to repo:org/repo:ref:refs/heads/main<br/>or an environment claim, never a wildcard.
    end

    alt Audience mismatch - rejected
        Job->>STS: AssumeRoleWithWebIdentity (aud = wrong-value)
        STS->>STS: aud != trust policy expected audience
        STS-->>Job: 403 AccessDenied (invalid audience)
    end

    alt Expired short-lived credentials
        Job->>Cloud: Deploy with expired SessionToken
        Cloud-->>Job: 403 ExpiredToken
        Job->>OIDC: Re-request OIDC token, exchange again
        Note over Job,STS: No static secret cached - just mint a fresh token.
    end

    alt Deprecated: long-lived stored access keys
        Note over Job,Cloud: Job reads a static AWS key from CI secrets.<br/>Never expires, over-scoped, leaks in logs.<br/>Deprecated - use the OIDC exchange above.
    end
```

Notes

- The JWT is minted per job and expires in minutes; the temporary cloud credentials it is
  exchanged for also carry a short TTL.
- STS validates the issuer signature via JWKS **and** the trust policy `sub`/`aud` conditions;
  both must pass.
- The wildcard-subject branch is the classic misconfiguration — a valid signature is not
  enough if any repo can produce a matching subject.
