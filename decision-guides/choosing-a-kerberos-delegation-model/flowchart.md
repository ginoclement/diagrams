---
title: "Choosing a Kerberos Delegation Model — Decision Tree"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing a Kerberos Delegation Model — Decision Tree

Leaves name the recommended model. Unconstrained delegation is ⛔ with its replacement.

```mermaid
flowchart TD
    S(["Front-end must call a back-end<br/>as the user"]) --> Q1{"Can you avoid delegation?<br/>(e.g. app calls with its own identity)"}
    Q1 -->|Yes| NONE(["No delegation -<br/>use the service's own identity"])

    Q1 -->|No - must impersonate| Q2{"Who administers the<br/>back-end resource?"}
    Q2 -->|Resource owner can configure it| RBCD(["Use Resource-Based<br/>Constrained Delegation ✅"])
    Q2 -->|Only the front-end is configurable| Q3{"Can you allow-list<br/>specific back-end SPNs?"}
    Q3 -->|Yes| CD(["Use Constrained Delegation<br/>(S4U2Proxy)"])
    Q3 -->|No - wants to delegate anywhere| UNC(["⛔ Unconstrained delegation -<br/>use RBCD instead"])
```

Leaf links

- **Use Resource-Based Constrained Delegation** → [`../../kerberos/resource-based-constrained-delegation/`](../../kerberos/resource-based-constrained-delegation/README.md)
- **Use Constrained Delegation (S4U2Proxy)** → [`../../kerberos/constrained-delegation/`](../../kerberos/constrained-delegation/README.md)
- **No delegation** → [`../../kerberos/tgs-exchange/`](../../kerberos/tgs-exchange/README.md) (standard service ticket, no impersonation)
- **⛔ Unconstrained delegation** → replacement [`../../kerberos/resource-based-constrained-delegation/`](../../kerberos/resource-based-constrained-delegation/README.md) (reference: [`../../kerberos/unconstrained-delegation/`](../../kerberos/unconstrained-delegation/README.md))
