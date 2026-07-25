---
title: "Choosing Session vs Token — Decision Tree"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing Session vs Token — Decision Tree

Leaves name the recommended session representation.

```mermaid
flowchart TD
    S(["Need to represent an<br/>authenticated session"]) --> Q1{"Primary consumer?"}

    Q1 -->|Browser, first-party web app| Q2{"Must revoke instantly<br/>and keep server state?"}
    Q2 -->|Yes| COOKIE(["Use Server-side session cookie"])
    Q2 -->|No - want statelessness| Q3

    Q1 -->|APIs / SPA / mobile / microservices| Q3{"How important is<br/>immediate revocation?"}
    Q3 -->|Low - short TTL is fine| JWT(["Use Stateless JWT"])
    Q3 -->|High - need central control| REF(["Use Reference token + introspection 🔵"])

    JWT --> N1["Mitigate: short TTL,<br/>rotate refresh tokens,<br/>denylist for emergencies"]
    COOKIE --> N2["Mitigate: HttpOnly, Secure,<br/>SameSite, CSRF token"]
    REF --> N3["Mitigate: cache introspection<br/>with a short TTL to cut latency"]
```

Leaf links

- **Use Server-side session cookie** → [`../../tokenless/session-cookie/`](../../tokenless/session-cookie/README.md)
- **Use Stateless JWT** → [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md) (JWT access/ID tokens)
- **Use Reference token + introspection** → [`../../oidc/authorization-code/`](../../oidc/authorization-code/README.md) (confidential client issues/holds the opaque token)
