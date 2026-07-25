---
title: "PIM JIT Elevation — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PIM JIT Elevation — Swimlane

One lane per actor. The Approver lane participates only when the role requires approval.

```mermaid
flowchart TD
    subgraph User
        U1["Request activation"]
        U2["Complete MFA"]
        U3["Use elevated token"]
        U4(["Privilege expired"])
    end

    subgraph Portal
        O1["Submit activation<br/>(duration, justification, ticket)"]
        O2["Show role active / denied"]
    end

    subgraph PIM
        P1["Check eligibility + rules"]
        P2{"Approval<br/>required?"}
        P3["Create active assignment<br/>(time-bound)"]
        P4["Deny / expire request"]
        P5["Auto-deactivate at window end"]
    end

    subgraph Entra
        E1["Enforce MFA / auth-context"]
        E2["Apply active role, issue token"]
    end

    subgraph Approver
        A1{"Approve?"}
    end

    subgraph API
        R1["Authorize privileged action"]
    end

    U1 --> O1 --> P1 --> E1 --> U2 --> P2
    P2 -->|No| P3
    P2 -->|Yes| A1
    A1 -->|Yes| P3
    A1 -->|No| P4 --> O2
    P3 --> E2 --> O2
    E2 --> U3 --> R1
    P3 --> P5 --> U4
```

Notes

- The MFA step (`E1 --> U2`) happens before the approval branch, so approvers only see
  requests from a strongly authenticated principal.
- Auto-deactivation (`P5`) removes privilege at the end of the window with no user action;
  a denied or timed-out request never creates an active assignment.
