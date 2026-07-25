# Cognito Identity Pool — Decision Flowchart

Role selection from an incoming request to issued AWS credentials, with deny terminals.

```mermaid
flowchart TD
    Start(["App requests AWS credentials<br/>(GetCredentialsForIdentity)"]) --> HasLogin{"Logins map<br/>provided?"}

    HasLogin -->|No| Guest{"Guest (unauthenticated)<br/>access enabled?"}
    Guest -->|No| ErrGuest(["AccessDenied: guest access disabled"])
    Guest -->|Yes| UnauthRole["Select unauthenticated role"] --> Aud

    HasLogin -->|Yes| TokOK{"Provider token valid,<br/>issuer trusted by pool?"}
    TokOK -->|No| ErrTok(["NotAuthorized: invalid token"])
    TokOK -->|Yes| Map{"Role-mapping rule<br/>matches a claim?"}
    Map -->|Yes| MappedRole["Select mapped role"] --> Aud
    Map -->|"No / default"| AuthRole["Select authenticated role"] --> Aud

    Aud{"Role trust policy: aud = pool ID<br/>and amr matches?"}
    Aud -->|No| ErrAud(["AccessDenied: trust policy condition"])
    Aud -->|Yes| Mint["Assume role, mint temporary credentials"]
    Mint --> Issue(["Return short-lived AWS credentials"])
```

Notes

- The first decision is authenticated vs guest; guest requires the pool to have
  unauthenticated access enabled and a scoped unauthenticated role.
- The trust-policy `aud`/`amr` gate is what stops another pool's tokens, or a guest, from
  assuming the authenticated role.
- Use `${cognito-identity.amazonaws.com:sub}` in the role policy to isolate each identity's
  resources.
