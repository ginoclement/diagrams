---
title: "Self-Service Password Reset — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Self-Service Password Reset — Swimlane

One lane per actor. Steps sit in the lane of the actor performing them; arrows
cross lanes at handoffs.

```mermaid
flowchart TD
    subgraph User
        U1["Click 'Forgot password'"]
        U2["Submit email/username"]
        U3["Open reset link from email"]
        U4["Enter OTP + new password"]
    end

    subgraph Browser
        B1["GET /reset request form"]
        B2["POST /reset-request"]
        B3["GET /reset?token=..."]
        B4["POST /reset-complete"]
    end

    subgraph IdP
        I1["Show request form"]
        I2["Look up account<br/>(uniform response)"]
        I3["Issue single-use,<br/>time-limited token"]
        I4{"Token valid + unexpired?"}
        I5{"OTP + policy + history<br/>+ breach OK?"}
        I6["Store new hash,<br/>consume token"]
        I7["Revoke all sessions<br/>+ refresh tokens"]
        I8["'Please sign in'"]
        I9["Reject: expired link /<br/>failed factor"]
    end

    subgraph Directory
        D1["Return account +<br/>recovery factors"]
        D2["Persist new password hash"]
        D3["Delete session records"]
    end

    subgraph RecoverySvc
        R1["Email reset link<br/>to user"]
        R2["Send OTP to<br/>recovery channel"]
    end

    U1 --> B1 --> I1 --> U2
    U2 --> B2 --> I2 --> D1
    D1 --> I3 --> R1 --> U3
    U3 --> B3 --> I4
    I4 -->|no| I9
    I4 -->|yes| R2 --> U4
    U4 --> B4 --> I5
    I5 -->|no| I9
    I5 -->|yes| I6 --> D2
    I6 --> I7 --> D3
    I7 --> I8
```
