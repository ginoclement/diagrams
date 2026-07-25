---
title: "PIM JIT Elevation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PIM JIT Elevation — Sequence Diagram

Happy path first (self-activation with MFA + justification), then the approval-required,
denied, and auto-deactivation alternates.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Portal as Portal
    participant PIM as PIM
    participant Entra as Entra
    participant Approver as Approver
    participant API as API

    User->>Portal: Request activation of eligible role
    Portal->>PIM: Activate (role, duration, justification, ticket)
    PIM->>PIM: Check eligibility + activation rules
    PIM->>Entra: Require MFA / auth-context for activation
    Entra-->>User: MFA challenge
    User->>Entra: Complete MFA
    Entra-->>PIM: MFA satisfied

    alt No approval required
        PIM->>Entra: Create active role assignment (time-bound)
        Entra-->>Portal: Role active until expiry
        User->>API: Call with token carrying the active role
        API-->>User: 200 - privileged action allowed
    else Approval required
        PIM->>Approver: Notify pending request (justification, ticket)
        alt Approver approves
            Approver->>PIM: Approve
            PIM->>Entra: Create active role assignment (time-bound)
            Entra-->>Portal: Role active until expiry
            User->>API: Call with elevated token
            API-->>User: 200 - allowed
        else Approver denies or window elapses
            Approver-->>PIM: Deny (or no action before deadline)
            PIM-->>Portal: Activation denied / expired, no privilege granted
        end
    end

    Note over PIM,Entra: At end of the time-bound window PIM<br/>deactivates the role, privilege removed
    opt New token needed after deactivation
        User->>Entra: Request token, role no longer active
        Entra-->>User: Token without the privileged role
    end
```

Notes

- Eligibility is necessary but not sufficient, the activation rules (MFA, justification,
  approval) must also pass before any privilege is granted.
- Approval is asynchronous, the request sits pending until an approver acts or the request
  deadline elapses.
- Deactivation is automatic at expiry; with CAE the already-issued elevated token can be
  revoked rather than lingering until it expires.
