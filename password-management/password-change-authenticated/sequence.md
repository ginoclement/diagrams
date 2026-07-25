---
title: "Authenticated Password Change — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Authenticated Password Change — Sequence Diagram

Happy path: a logged-in user reauthenticates with the current password, the new
password passes policy/history/breach checks, the hash is updated, and other
sessions are revoked. Alternates: wrong current password, new password rejected
by history/policy, and a step-up MFA requirement.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (app / auth server)
    participant Dir as Directory

    %% ----- happy path -----
    User->>Browser: Open account -> Change password
    Browser->>IdP: GET /account/password (with session cookie)
    IdP-->>Browser: Change form (current + new + confirm)
    User->>Browser: Enter current + new password
    Browser->>IdP: POST /account/password (current, new)
    IdP->>Dir: Verify current password (reauth)
    Dir-->>IdP: Current password correct
    Note over IdP,Dir: Reauth proves the account owner, not just a live session
    IdP->>IdP: Check policy + breach + not-equal-to-old
    IdP->>Dir: Compare new against password history
    Dir-->>IdP: Not previously used
    IdP->>Dir: Store new hash, append old hash to history
    Dir-->>IdP: Updated
    IdP->>Dir: Revoke all OTHER sessions + refresh tokens
    Note over IdP,Dir: Keep this session, evict every other device
    IdP-->>Browser: Password changed, other sessions signed out

    %% ----- alternates -----
    alt Current password wrong
        Browser->>IdP: POST /account/password (wrong current)
        IdP->>Dir: Verify current password
        Dir-->>IdP: Incorrect
        IdP->>IdP: Increment reauth-failure counter, rate-limit
        IdP-->>Browser: Current password is incorrect
    end

    alt New password rejected (reuse or policy)
        Browser->>IdP: POST /account/password (current OK, new weak/reused)
        IdP->>Dir: Compare new against history
        Dir-->>IdP: Matches old / recent password
        IdP-->>Browser: Choose a password you have not used before
    end

    alt Step-up MFA before change (sensitive account)
        Browser->>IdP: POST /account/password (current, new)
        IdP->>IdP: Policy requires fresh MFA for this change
        IdP-->>Browser: Confirm with your authenticator
        User->>Browser: Complete MFA challenge
        Browser->>IdP: MFA assertion
        IdP->>IdP: Verify MFA, then commit change
        IdP->>Dir: Store new hash, revoke other sessions
        IdP-->>Browser: Password changed
    end
```
