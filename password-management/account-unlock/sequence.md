---
title: "Account Unlock — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Account Unlock — Sequence Diagram

Happy path: a locked-out user proves identity with MFA, the account is unlocked, and
the failure counter is reset — no password change required. Alternates: auto-unlock
after a cool-down timeout, admin unlock after caller verification, and repeated
lockout that escalates to a security alert.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (auth server)
    participant Dir as Directory
    participant Rec as RecoverySvc
    actor Admin

    %% ----- happy path -----
    User->>Browser: Attempt login
    Browser->>IdP: POST /login (credentials)
    IdP->>Dir: Read lockout state + failure counter
    Dir-->>IdP: Account LOCKED (threshold exceeded)
    IdP-->>Browser: Account locked, verify identity to unlock
    Note over IdP,Browser: Uniform, rate-limited response, does not confirm lock status to strangers
    User->>Browser: Start unlock, choose MFA
    Browser->>IdP: POST /unlock (identifier)
    IdP->>Rec: Send unlock OTP / push challenge
    Rec-->>User: MFA challenge
    User->>Browser: Complete MFA
    Browser->>IdP: Submit MFA assertion
    IdP->>IdP: Verify MFA
    IdP->>Dir: Clear lock, reset failure counter
    Dir-->>IdP: Account unlocked
    Note over IdP,Dir: Unlock restores access, password unchanged
    IdP-->>Browser: Unlocked, you may sign in

    %% ----- alternates -----
    alt Auto-unlock after timeout
        Browser->>IdP: POST /login (after cool-down)
        IdP->>Dir: Read lockout state
        Dir-->>IdP: Cool-down elapsed, lock auto-cleared, counter reset
        IdP-->>Browser: Proceed with normal login
    end

    alt Admin unlock
        Admin->>IdP: Verify caller, request unlock
        Note over Admin,IdP: Caller verified out-of-band before any action
        IdP->>Dir: Clear lock, reset counter (password unchanged)
        Dir-->>IdP: Unlocked
        IdP->>Rec: Notify user of admin unlock
        IdP-->>Admin: Account unlocked
    end

    alt Repeated lockout -> escalate
        IdP->>Dir: Read lockout history
        Dir-->>IdP: Multiple locks in short window
        IdP->>IdP: Raise security alert, apply exponential backoff
        IdP->>IdP: Require MFA-backed reset, not simple unlock
        IdP-->>Browser: Additional verification required (possible attack)
    end
```
