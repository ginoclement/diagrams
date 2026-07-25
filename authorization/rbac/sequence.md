---
title: "RBAC — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RBAC — Sequence Diagram

Happy path first (a role grants the permission), then alternates: permission inherited through
the role hierarchy, denial when no active role grants it, a Dynamic Separation of Duty conflict at
role activation, and the role-explosion note.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant PEP as PEP (App)
    participant Store as RBAC Store
    participant API as Resource

    User->>PEP: Request action invoice:approve on invoice 42
    PEP->>Store: Resolve active roles for user
    Store-->>PEP: Roles [Billing Clerk, Approver]
    PEP->>Store: Does any active role grant invoice:approve?
    Store-->>PEP: Yes - Approver grants invoice:approve
    PEP->>API: Forward approve invoice 42
    API-->>PEP: 200 Approved
    PEP-->>User: 200 Success

    alt Permission via role hierarchy
        User->>PEP: Request report:read
        PEP->>Store: Active roles [Manager]
        Store->>Store: Manager inherits Analyst (senior to junior)<br/>Analyst grants report:read
        Store-->>PEP: Granted via inheritance
        PEP-->>User: 200 Success
    else No role grants the permission
        User->>PEP: Request ledger:close
        PEP->>Store: Active roles [Billing Clerk, Approver]
        Store-->>PEP: No active role grants ledger:close
        PEP-->>User: 403 Forbidden
    else Dynamic Separation of Duty conflict
        User->>PEP: Activate role Approver in this session
        PEP->>Store: Check DSD constraints for session
        Store->>Store: Preparer already active - Preparer and Approver<br/>are mutually exclusive at runtime
        Store-->>PEP: Denied - DSD violation
        PEP-->>User: 403 Cannot activate conflicting role
    end

    note over PEP,Store: Role explosion smell - if approval needs region + tier,<br/>do NOT mint Approver-EU-Tier1 roles.<br/>Move region/tier to attributes (see ABAC) or ownership (ReBAC).
```

Notes

- Role resolution reads only **active** roles for the session (constrained RBAC); a user may hold
  more roles than are activated.
- Hierarchy inheritance is transitive: a senior role gets the permissions of every role beneath it.
- Static SoD is enforced earlier, at **assignment** time (a user may never be granted both roles);
  DSD is enforced here, at **activation** time.
