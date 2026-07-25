---
title: "Account Unlock — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Account Unlock — Swimlane

One lane per actor. Steps sit in the lane of the actor performing them; arrows
cross lanes at handoffs.

```mermaid
flowchart TD
    subgraph User
        U1["Attempt login"]
        U2["Start unlock, complete MFA"]
    end

    subgraph Browser
        B1["POST /login"]
        B2["POST /unlock + MFA assertion"]
    end

    subgraph IdP
        I1{"Account locked?"}
        I2{"Cool-down elapsed?<br/>(auto-unlock)"}
        I3["Prompt identity proof<br/>(uniform response)"]
        I4{"MFA verified?"}
        I5{"Repeated lockout<br/>pattern?"}
        I6["Clear lock,<br/>reset counter"]
        I7["Proceed to normal login"]
        I8["Escalate: alert +<br/>require MFA-backed reset"]
        I9["Deny: verification failed"]
    end

    subgraph Directory
        D1["Read lockout state<br/>+ failure counter"]
        D2["Clear lock, reset counter"]
    end

    subgraph RecoverySvc
        R1["Send unlock OTP /<br/>push challenge"]
        R2["Notify user of unlock"]
    end

    subgraph Admin
        A1["Verify caller,<br/>request admin unlock"]
    end

    U1 --> B1 --> I1
    I1 --> D1
    D1 -->|not locked| I7
    D1 -->|locked| I2
    I2 -->|yes| D2 --> I7
    I2 -->|no| I5
    I5 -->|yes| I8
    I5 -->|no| I3 --> R1 --> U2
    U2 --> B2 --> I4
    I4 -->|no| I9
    I4 -->|yes| I6 --> D2
    I6 --> R2
    A1 --> I6
```
