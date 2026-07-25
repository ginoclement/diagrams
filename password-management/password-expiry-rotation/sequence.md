---
title: "Password Expiry and Rotation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Password Expiry and Rotation — Sequence Diagram

Happy path: the user logs in, the IdP detects an expired / must-change credential,
withholds the session, forces a compliant new password, then grants access.
Alternates: grace logins remaining, pre-expiry warning banner, and admin
force-expire.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (auth server)
    participant Dir as Directory

    %% ----- happy path -----
    User->>Browser: Enter username + password
    Browser->>IdP: POST /login (credentials)
    IdP->>Dir: Verify credentials, read password age + must-change flag
    Dir-->>IdP: Credentials valid, password EXPIRED
    Note over IdP,Dir: Identity confirmed, but no session granted yet
    IdP-->>Browser: Password expired, set a new one now (no session issued)
    User->>Browser: Enter new password + confirm
    Browser->>IdP: POST /login/change (old, new)
    IdP->>IdP: Check policy + breach + history, new != old
    IdP->>Dir: Store new hash, clear must-change, reset age timer
    Dir-->>IdP: Updated
    IdP-->>Browser: 302 to /home + Set-Cookie (session now granted)

    %% ----- alternates -----
    alt Grace logins remaining
        Browser->>IdP: POST /login (valid, just expired)
        IdP->>Dir: Read grace-login counter
        Dir-->>IdP: 2 of 3 grace logins used
        IdP->>Dir: Decrement grace counter
        IdP-->>Browser: Access granted, but change soon (1 login left)
    end

    alt Pre-expiry warning banner
        Browser->>IdP: POST /login (valid, not yet expired)
        IdP->>Dir: Read password age
        Dir-->>IdP: Expires in 5 days
        IdP-->>Browser: 302 to /home + banner "password expires in 5 days"
    end

    alt Admin force-expire
        Note over IdP,Dir: Admin sets must-change flag out of band
        Browser->>IdP: POST /login (valid credentials)
        IdP->>Dir: Read must-change flag
        Dir-->>IdP: must-change = true
        IdP-->>Browser: Password change required before continuing
    end
```
