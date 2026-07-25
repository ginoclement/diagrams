# Entra Workload Identity Federation — Decision Flowchart

Every claim Entra checks on the external assertion, with explicit deny terminals.

```mermaid
flowchart TD
    Start(["Workload presents external OIDC assertion<br/>to Entra token endpoint"]) --> Disc{"Issuer OIDC discovery<br/>+ JWKS reachable?"}
    Disc -->|No| ErrDisc(["400: issuer metadata unavailable"])
    Disc -->|Yes| Sig{"Assertion signature<br/>valid against JWKS?"}

    Sig -->|No| ErrSig(["400: invalid assertion signature"])
    Sig -->|Yes| Iss{"iss matches a federated<br/>credential on the app?"}

    Iss -->|No| ErrIss(["400 AADSTS700213:<br/>no matching federated record"])
    Iss -->|Yes| Sub{"sub matches the pinned<br/>subject exactly?"}

    Sub -->|No| ErrSub(["400: subject mismatch<br/>(wrong branch/env/repo)"])
    Sub -->|Yes| Aud{"aud equals the expected<br/>audience?"}

    Aud -->|No| ErrAud(["400: audience mismatch"])
    Aud -->|Yes| Exp{"Assertion within<br/>its validity window?"}

    Exp -->|No| ErrExp(["400: expired assertion"])
    Exp -->|Yes| Issue(["Issue Entra access_token<br/>bound to the app permissions"])
```

Notes

- All four claim gates (`Iss`, `Sub`, `Aud`, `Exp`) must pass; the tight `Sub` match is the main
  scoping control.
- No stored secret is involved — a compromised external signing key or a loose `Sub` are the
  realistic risks.
- The issued token is a normal Entra access token, subsequently validated by the target API.
