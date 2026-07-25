# OIDC to Cloud Federation — Decision Flowchart

Every gate the cloud STS applies before handing back credentials, plus the deprecated
stored-key branch. Deny paths terminate explicitly.

```mermaid
flowchart TD
    S(["CI job needs cloud access"]) --> Q0{"Use OIDC federation<br/>or a stored key?"}
    Q0 -->|"Stored key (deprecated)"| DEP(["Long-lived credentials<br/>never expire, broad blast radius"])
    Q0 -->|"OIDC federation"| MINT["Request OIDC token<br/>with target audience"]

    MINT --> SIGN["CI issuer signs JWT<br/>sub, aud, actor, environment"]
    SIGN --> EX["Call cloud STS exchange<br/>with the JWT"]

    EX --> Q1{"JWT signature valid<br/>against issuer JWKS?"}
    Q1 -->|"No"| E1(["Reject: bad signature"])
    Q1 -->|"Yes"| Q2{"aud == trust policy<br/>expected audience?"}
    Q2 -->|"No"| E2(["403: audience mismatch"])
    Q2 -->|"Yes"| Q3{"sub matches trust policy<br/>condition (repo + ref/env)?"}

    Q3 -->|"No match"| E3(["403: subject not allowed"])
    Q3 -->|"Wildcard match<br/>(misconfig)"| WARN(["Credentials issued to<br/>fork/other repo - FIX: pin sub"])
    Q3 -->|"Exact pinned match"| ISSUE["Issue short-lived credentials<br/>with scoped TTL"]

    ISSUE --> Q4{"Credentials still<br/>within TTL?"}
    Q4 -->|"No"| E4(["403 ExpiredToken<br/>re-mint and retry"])
    Q4 -->|"Yes"| OK(["Deploy to cloud"])
```

Notes

- The signature gate (`Q1`) comes first, but it is necessary, not sufficient — a validly
  signed token from an unexpected repo still must fail `Q2`/`Q3`.
- `Q3`'s wildcard branch is a misconfiguration, not a feature: pin `sub` to the exact
  `repo:org/repo:ref:...` or an `environment` claim so forks cannot assume the role.
- The expired-credential branch (`Q4`) re-mints a fresh token rather than caching a static
  secret — the whole point of the keyless model.
