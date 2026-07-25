---
title: "Admin-Initiated Password Reset — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Admin-Initiated Password Reset — Sequence Diagram

Happy path: admin authenticates, verifies the caller out-of-band, issues a
temporary password, forces change at next login, notifies and audits. Alternates:
caller verification fails, emailed reset link instead of a temp password, and
force-logout everywhere.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant IdP as IdP (admin console)
    participant Dir as Directory
    participant Rec as RecoverySvc
    actor User

    %% ----- happy path -----
    Admin->>IdP: Sign in to admin console (with MFA)
    IdP->>IdP: Authenticate + authorize admin for this target
    Note over Admin,IdP: Admin must be authorized to reset THIS user, not just logged in
    Admin->>User: Out-of-band caller verification (callback, ID, shared secret)
    User-->>Admin: Provides verification proof
    Admin->>IdP: Confirm identity verified, request reset
    IdP->>IdP: Record verification method in audit trail
    IdP->>Dir: Set temporary password hash, flag mustChangePassword=true
    Dir-->>IdP: Updated
    IdP->>Dir: Revoke all sessions + refresh tokens for user
    Note over IdP,Dir: Force-logout everywhere evicts any resident attacker
    IdP->>Rec: Deliver temp password to user's verified channel
    Rec-->>User: Temporary password (single-use, short TTL)
    IdP->>Rec: Send "an admin reset your password" alert
    Rec-->>User: Security notification (out-of-band)
    IdP-->>Admin: Reset complete, user must change at next login

    User->>IdP: Sign in with temporary password
    IdP->>IdP: mustChangePassword set -> redirect to change
    IdP-->>User: Set a new password now

    %% ----- alternates -----
    alt Caller verification fails
        Admin->>User: Out-of-band verification
        User-->>Admin: Fails / cannot prove identity
        Admin->>IdP: Abort reset, log failed verification
        IdP->>IdP: Record failed attempt, no credential issued
        IdP-->>Admin: Reset denied
    end

    alt Emailed reset link instead of temp password
        Admin->>IdP: Choose "send reset link"
        IdP->>Rec: Send single-use, time-limited reset link
        Rec-->>User: Reset link email
        User->>IdP: Open link, set new password
        IdP->>Dir: Store new hash, consume link
        IdP-->>User: Password set
    end

    alt Force-logout everywhere (already handled inline)
        IdP->>Dir: Ensure all active sessions revoked
        Dir-->>IdP: Sessions cleared
        IdP-->>Admin: Confirmed: user signed out on all devices
    end
```
