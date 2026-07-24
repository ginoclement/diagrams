# API Gateway AuthN/AuthZ — Token Validation Decision Flowchart

The gateway's decision path for one request: rate limit, then token validation (JWT or
opaque), then scope-based authorization, then downstream token exchange and routing.
Each failure has an explicit deny terminal and the gateway fails closed.

```mermaid
flowchart TD
    Start(["Request arrives at gateway (TLS terminated)"]) --> RL{"Within rate<br/>limit?"}
    RL -->|No| Deny429(["429 too many requests"])
    RL -->|Yes| Present{"Bearer token<br/>present?"}

    Present -->|No| Deny401a(["401: no credentials"])
    Present -->|Yes| Type{"Token type?"}

    Type -->|"JWT"| Kid{"kid resolves to a<br/>known JWKS key?"}
    Kid -->|No| Deny401b(["401: unknown signing key"])
    Kid -->|Yes| Sig{"Signature + alg<br/>valid? (reject alg none)"}
    Sig -->|No| Deny401c(["401: bad signature"])
    Sig -->|Yes| Claims{"iss, aud, exp / nbf<br/>all valid?"}

    Type -->|"Opaque"| Intro{"Introspection<br/>active = true?"}
    Intro -->|No| Deny401d(["401: inactive / revoked token"])
    Intro -->|Yes| Claims

    Claims -->|No| Deny401e(["401: expired / wrong audience"])
    Claims -->|Yes| Scope{"Token scope / claims<br/>allow this route + method?"}

    Scope -->|No| Deny403(["403: insufficient scope"])
    Scope -->|Yes| Exch{"Downstream needs a<br/>scoped credential?"}

    Exch -->|Yes| STS["Exchange for service-scoped token"]
    Exch -->|No| Route
    STS --> Route["Route to microservice<br/>with forwarded identity"]
    Route --> Done(["200: upstream response returned"])
```

Notes

- The **algorithm allow-list** gate is essential: rejecting `alg: none` and confusing
  algorithm substitution (e.g. RS256 verified as HS256) closes classic JWT bypasses.
- **401 vs 403 are distinct outcomes**: 401 means the token failed authentication; 403
  means it authenticated but lacks the scope for this resource. Conflating them leaks
  information and masks misconfiguration.
- Both token types converge on the same **claims** and **scope** gates — validation method
  differs, but the authorization decision is uniform.
- Any gate that cannot be positively satisfied denies; the gateway never routes on doubt.
