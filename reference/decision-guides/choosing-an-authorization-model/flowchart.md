---
title: "Choosing an Authorization Model — Decision Tree"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing an Authorization Model — Decision Tree

Leaves name the recommended model; the legacy standard is 🟡 with its replacement.

```mermaid
flowchart TD
    S(["Need a fine-grained<br/>authorization decision"]) --> Q1{"Is the decision mainly<br/>about relationships between<br/>objects? (owner, member, parent)"}

    Q1 -->|"Yes, and at large scale"| REBAC(["Use ReBAC (Zanzibar)"])
    Q1 -->|No| Q2{"Does it depend on attribute<br/>values? (clearance, dept,<br/>time, location, resource tags)"}

    Q2 -->|"No - stable job functions"| RBAC(["Use RBAC"])
    Q2 -->|Yes| Q3{"Must policy be externalized:<br/>centrally authored, versioned,<br/>tested, decoupled from code?"}

    Q3 -->|"No - inline attribute rules"| ABAC(["Use ABAC"])
    Q3 -->|Yes| PBAC(["Use PBAC (policy engine)"])

    S --> LEG{"Adopting the classic<br/>XACML architecture?"}
    LEG -->|"New build"| XACML(["🟡 XACML -<br/>use a modern policy engine (PBAC)"])
```

Leaf links

- **Use RBAC** → [`../../authorization/rbac/`](../../../authorization/rbac/README.md)
- **Use ABAC** → [`../../authorization/abac/`](../../../authorization/abac/README.md)
- **Use ReBAC (Zanzibar)** → [`../../authorization/rebac-zanzibar/`](../../../authorization/rebac-zanzibar/README.md)
- **Use PBAC (policy engine)** → [`../../authorization/pbac-policy-engine/`](../../../authorization/pbac-policy-engine/README.md)
- **🟡 XACML** → replacement [`../../authorization/pbac-policy-engine/`](../../../authorization/pbac-policy-engine/README.md) (reference: [`../../authorization/xacml-pdp-pep/`](../../../authorization/xacml-pdp-pep/README.md))
