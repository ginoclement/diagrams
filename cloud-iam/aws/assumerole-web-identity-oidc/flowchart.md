# AssumeRoleWithWebIdentity — Decision Flowchart

Token validation and trust-policy claim gates, ending in credentials or explicit denials.

```mermaid
flowchart TD
    Start(["Workload calls AssumeRoleWithWebIdentity<br/>with an OIDC JWT"]) --> Sig{"JWT signature verifies<br/>against issuer JWKS?"}
    Sig -->|No| ErrSig(["400 InvalidIdentityToken: bad signature"])
    Sig -->|Yes| Exp{"Token unexpired<br/>(exp in future)?"}

    Exp -->|No| ErrExp(["400 ExpiredTokenException"])
    Exp -->|Yes| Prov{"iss registered as an<br/>IAM OIDC provider?"}

    Prov -->|No| ErrProv(["AccessDenied: unknown issuer"])
    Prov -->|Yes| Aud{"aud in provider ClientIDList<br/>AND trust policy aud condition?"}

    Aud -->|No| ErrAud(["AccessDenied: audience mismatch"])
    Aud -->|Yes| Sub{"Trust policy sub condition<br/>matches the token sub?"}

    Sub -->|No| ErrSub(["AccessDenied: subject not permitted"])
    Sub -->|"Yes but wildcard scope"| Warn["Assume succeeds but<br/>scope is over-broad"] --> Mint
    Sub -->|"Yes, tightly scoped"| Mint["Mint temporary credentials<br/>scoped to the role"]

    Mint --> Issue(["Return short-lived credentials<br/>(no static AWS keys used)"])
```

Notes

- The signature/exp gates are done by STS via JWKS; the `aud`/`sub` gates are the trust
  policy conditions you author.
- The wildcard-`sub` branch is drawn deliberately: it still succeeds, which is why it is a
  finding, not an error — tighten `sub` to a specific repo/ref/environment.
- No AWS signature is checked on the call itself; the JWT is the entire proof of identity.
