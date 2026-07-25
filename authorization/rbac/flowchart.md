---
title: "RBAC — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RBAC — Decision Flowchart

The full permit/deny logic: session activation with Separation of Duty gates, hierarchy expansion,
and the permission match. Deny terminals are explicit.

```mermaid
flowchart TD
    Start(["Subject requests action on resource"]) --> Auth{"Subject<br/>authenticated?"}
    Auth -->|No| DenyAnon(["Deny: authentication required"])
    Auth -->|Yes| Assigned{"Any roles<br/>assigned to subject?"}
    Assigned -->|No| DenyNoRole(["Deny: no roles"])
    Assigned -->|Yes| Activate["Activate roles for session"]

    Activate --> SSD{"Assignment violates<br/>Static SoD?<br/>(mutually exclusive roles held)"}
    SSD -->|Yes| DenySSD(["Deny/Block: SSD violation<br/>(caught at assignment)"])
    SSD -->|No| DSD{"Activation violates<br/>Dynamic SoD?<br/>(conflicting active roles)"}
    DSD -->|Yes| DenyDSD(["Deny: DSD violation<br/>cannot activate conflicting role"])
    DSD -->|No| Expand["Expand role hierarchy<br/>(senior inherits junior perms)"]

    Expand --> Match{"Effective permissions<br/>include requested<br/>action + resource type?"}
    Match -->|No| DenyPerm(["Deny: 403 no matching permission"])
    Match -->|Yes| Scope{"Constrained RBAC:<br/>permission in scope of<br/>an active role?"}
    Scope -->|No| DenyInactive(["Deny: role holds it<br/>but is not active this session"])
    Scope -->|Yes| Permit(["Permit: execute action"])
```

Notes

- RBAC matches on **resource type**, not resource instance: it can grant `invoice:approve` but not
  "approve *this* invoice because you own it". Instance-level conditions belong to
  [ABAC](../abac/README.md) or [ReBAC](../rebac-zanzibar/README.md).
- The two SoD gates run at different times: SSD at **assignment** (a user can never be granted both
  roles), DSD at **session activation** (both may be held but not simultaneously active).
- If you find yourself adding a decision here for region, tenant, tier, or ownership, that is the
  **role-explosion** signal — encode it as an attribute or relationship, not a new role.
