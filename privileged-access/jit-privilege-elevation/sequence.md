# Just-In-Time Privilege Elevation — Sequence Diagram

Happy path first (approval-required activation, use, auto-revoke), then alternates:
auto-approved activation, denied activation, and early manual deactivation.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant PIM as PIM service
    participant Approver
    participant Dir as Directory
    participant Target

    Note over User,Dir: Standing state - User is ELIGIBLE for the role, not assigned it

    User->>PIM: Request activation (role, scope, duration, justification)
    PIM->>PIM: Evaluate activation policy<br/>(risk, location, ticket, MFA freshness)
    PIM->>User: Require fresh phishing-resistant MFA
    User->>PIM: Complete MFA challenge

    alt Role requires approval
        PIM->>Approver: Approval request (who, role, scope, reason)
        Approver-->>PIM: Approve (or deny)
    else Role is auto-approved
        PIM->>PIM: Policy allows immediate activation
    end

    PIM->>Dir: Create time-bound active assignment (TTL = window)
    Dir-->>PIM: Assignment written, expiry scheduled
    PIM-->>User: Activated until T+window

    User->>Target: Perform privileged work with active role
    Target-->>User: Actions authorized by active assignment

    Note over PIM,Dir: Window elapses

    PIM->>Dir: Remove active assignment at expiry
    Dir-->>PIM: Assignment revoked - User back to eligible-only
    PIM-->>User: Elevation expired (notification)

    alt Activation denied by policy or approver
        PIM-->>User: Denied - risky sign-in / no approval /<br/>justification or ticket missing
        Note over PIM,Dir: No assignment ever written - standing state unchanged
    end

    alt Early manual deactivation
        User->>PIM: Deactivate now (work finished)
        PIM->>Dir: Remove active assignment before expiry
        Dir-->>PIM: Revoked early
    end
```

Notes

- The persistent eligible assignment is the pre-condition, not part of the timed flow;
  the timed assignment (`create ... TTL` to `remove at expiry`) is what actually confers
  privilege.
- Fresh MFA is demanded at activation regardless of session age — the activation event is
  where access is granted.
- Auto-revoke fires from the scheduled expiry with no user turn, which is the property
  that guarantees no lingering standing privilege.
