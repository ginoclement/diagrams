# Workload Identity Federation — Decision Flowchart

The STS validation gates in order, from token receipt to credential issuance, with each
denial drawn as an explicit terminal.

```mermaid
flowchart TD
    Start(["Workload needs target credentials"]) --> Tok["Request OIDC token<br/>from platform IdP (aud = target)"]
    Tok --> Ex["Present token to target STS"]
    Ex --> Sig{"Signature verifies<br/>against issuer JWKS?"}
    Sig -->|No| ErrSig(["Deny: bad signature / unknown key"])
    Sig -->|Yes| Iss{"iss matches a<br/>registered issuer?"}
    Iss -->|No| ErrIss(["Deny: untrusted issuer"])
    Iss -->|Yes| Aud{"aud matches the<br/>expected audience?"}
    Aud -->|No| ErrAud(["Deny: audience mismatch"])
    Aud -->|Yes| Exp{"exp / nbf within range<br/>(with small skew)?"}
    Exp -->|No| ErrExp(["Deny: expired or not yet valid"])
    Exp -->|Yes| Cond{"sub / claim conditions<br/>in trust policy met?"}
    Cond -->|No| ErrCond(["Deny: subject / claim condition failed"])
    Cond -->|Yes| Mint["Mint short-lived credentials<br/>scoped to role / service account"]

    Mint --> Imp{"Impersonation<br/>required? (GCP)"}
    Imp -->|Yes| Imp2["Exchange for SA access token"]
    Imp -->|No| Use
    Imp2 --> Use(["Call target API with<br/>short-lived credentials"])
```

Notes

- Order matters: signature and issuer are checked before audience and conditions, so an untrusted token is rejected before any policy logic runs.
- The audience and condition gates together stop token replay and the confused-deputy problem — the two failure modes unique to federation.
- Credentials are always short-lived; a fresh OIDC token and exchange are needed once they expire, so there is nothing durable to steal.
</content>
