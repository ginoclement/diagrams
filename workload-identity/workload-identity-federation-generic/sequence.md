# Workload Identity Federation — Sequence Diagram

Happy path first: obtain platform OIDC token, exchange at the target STS, call the API.
Alternates: audience mismatch, subject/claim condition failure, optional impersonation,
and expired token.

```mermaid
sequenceDiagram
    autonumber
    participant WL as Workload
    participant IdP as Platform IdP
    participant STS as Target STS
    participant API as Target API

    Note over STS: One-time trust setup: register issuer + JWKS,<br/>expected aud, and sub/claim conditions

    WL->>IdP: Request ID token (aud = target audience)
    IdP->>IdP: Sign JWT: iss, sub, aud, exp,<br/>platform claims (repo, branch, namespace)
    IdP-->>WL: Short-lived OIDC ID token
    WL->>STS: Exchange token<br/>(AssumeRoleWithWebIdentity / STS token / federated cred)
    STS->>IdP: Fetch JWKS from issuer discovery
    IdP-->>STS: Signing keys
    STS->>STS: Verify signature, iss, aud, exp/nbf

    alt Conditions satisfied
        STS->>STS: Check sub / claim conditions<br/>in trust policy - match
        STS-->>WL: Short-lived target credentials<br/>scoped to role / service account
        opt Service-account impersonation (GCP)
            WL->>STS: Impersonate service account<br/>with federated token
            STS-->>WL: SA access token
        end
        WL->>API: Call API with short-lived credentials
        API-->>WL: 200 data
    else Audience mismatch
        STS-->>WL: Denied: aud does not match registered audience
    else Subject / claim condition not met
        STS->>STS: Right issuer, wrong repo/branch/namespace
        STS-->>WL: Denied: sub / claim condition failed
    else Token expired or not yet valid
        STS-->>WL: Denied: exp / nbf out of range
    end
```

Notes

- The workload never holds a long-lived secret: the only durable state is the trust configuration registered once at the STS.
- JWKS is fetched (and cached) by the STS from the issuer's discovery document, so issuer key rotation is transparent as long as the new keys are published before old ones retire.
- The impersonation step is GCP-specific; AWS and Azure return usable credentials directly from the first exchange.
</content>
