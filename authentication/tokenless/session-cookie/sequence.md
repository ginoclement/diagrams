---
title: "Session Cookie Authentication — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Session Cookie Authentication — Sequence Diagram

Happy path: form login, session-ID rotation, authenticated request. Alternates:
invalid credentials with lockout, expired/idle session, CSRF check on a
state-changing request.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Server as Server (web app)
    participant Dir as Directory
    participant Store as SessionStore

    %% ----- happy path -----
    User->>Browser: Navigate to /login
    Browser->>Server: GET /login
    Server-->>Browser: Login form + pre-login session (anonymous sid, CSRF token)
    User->>Browser: Enter username + password
    Browser->>Server: POST /login (credentials, CSRF token)
    Server->>Dir: Verify credentials (hash compare / LDAP bind)
    Dir-->>Server: Credentials valid
    Server->>Store: Destroy anonymous session
    Server->>Store: Create new session (rotated sid, user id, expiry, CSRF token)
    Note over Server,Store: Session ID rotation on login prevents session fixation
    Server-->>Browser: 302 to /home + Set-Cookie sid=NEW (HttpOnly, Secure, SameSite=Lax)
    Browser->>Server: GET /home (Cookie sid=NEW)
    Server->>Store: Lookup sid, check idle + absolute expiry
    Store-->>Server: Session valid, user id
    Server-->>Browser: 200 personalized page

    %% ----- alternates -----
    alt Invalid credentials (with lockout counter)
        Browser->>Server: POST /login (wrong password)
        Server->>Dir: Verify credentials
        Dir-->>Server: Invalid
        Server->>Server: Increment failed-attempt counter
        opt Counter >= threshold
            Server->>Server: Lock account temporarily
            Server-->>Browser: 200 generic error (account locked, retry later)
        end
        Server-->>Browser: 200 generic "invalid credentials" (no username enumeration)
    end

    alt Expired or idle session
        Browser->>Server: GET /account (Cookie sid=OLD)
        Server->>Store: Lookup sid
        Store-->>Server: Not found or past idle/absolute timeout
        Server->>Store: Delete stale record if present
        Server-->>Browser: 302 to /login + clear cookie (re-authentication required)
    end

    alt CSRF check on state-changing request
        Browser->>Server: POST /transfer (Cookie sid=NEW, CSRF token in body/header)
        Server->>Store: Lookup sid, fetch expected CSRF token
        alt Token matches session-bound value
            Server-->>Browser: 200 action performed
        else Token missing or mismatched
            Server-->>Browser: 403 Forbidden (possible CSRF, request rejected)
        end
    end
```
