---
title: "Session Cookie Authentication — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Session Cookie Authentication — Swimlane

One lane per actor. Steps sit in the lane of the actor performing them; arrows
cross lanes at handoffs.

```mermaid
flowchart TD
    subgraph User
        U1["Open login page"]
        U2["Enter username + password"]
    end

    subgraph Browser
        B1["GET /login"]
        B2["POST /login with credentials + CSRF token"]
        B3["Store cookie sid=NEW<br/>(HttpOnly, Secure, SameSite=Lax)"]
        B4["GET /home with Cookie sid=NEW"]
    end

    subgraph Server
        S1["Serve login form +<br/>anonymous session + CSRF token"]
        S2["Validate CSRF token,<br/>look up user"]
        S3{"Credentials valid?"}
        S4["Rotate session ID<br/>(anti session-fixation)"]
        S5["302 redirect + Set-Cookie sid=NEW"]
        S6["Validate sid + expiry on each request"]
        S7["Render authenticated page"]
        S8["Generic error, increment<br/>lockout counter"]
    end

    subgraph Directory
        D1["Verify password hash / LDAP bind"]
    end

    subgraph SessionStore
        SS1["Create anonymous session"]
        SS2["Destroy old session,<br/>create authenticated session"]
        SS3["Return session record"]
    end

    U1 --> B1 --> S1
    S1 --> SS1
    S1 --> U2
    U2 --> B2 --> S2
    S2 --> D1 --> S3
    S3 -->|yes| S4
    S4 --> SS2 --> S5
    S5 --> B3 --> B4
    B4 --> S6
    S6 --> SS3 --> S7
    S3 -->|no| S8
    S8 --> B2
```
