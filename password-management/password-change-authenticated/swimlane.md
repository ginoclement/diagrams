---
title: "Authenticated Password Change — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Authenticated Password Change — Swimlane

One lane per actor. Steps sit in the lane of the actor performing them; arrows
cross lanes at handoffs.

```mermaid
flowchart TD
    subgraph User
        U1["Open Change password"]
        U2["Enter current + new password"]
        U3["Complete MFA challenge<br/>(if required)"]
    end

    subgraph Browser
        B1["GET change form<br/>(with session cookie)"]
        B2["POST current + new"]
        B3["Submit MFA assertion"]
    end

    subgraph IdP
        I1["Serve change form"]
        I2{"Current password<br/>correct? (reauth)"}
        I3{"Step-up MFA<br/>required?"}
        I4{"New password OK?<br/>policy + history + breach"}
        I5["Store new hash,<br/>append old to history"]
        I6["Revoke all OTHER<br/>sessions + tokens"]
        I7["Password changed"]
        I8["Reject: current wrong /<br/>weak / reused"]
    end

    subgraph Directory
        D1["Verify current hash"]
        D2["Return history comparison"]
        D3["Persist new hash + history"]
        D4["Delete other session records"]
    end

    U1 --> B1 --> I1 --> U2
    U2 --> B2 --> I2
    I2 --> D1
    D1 -->|no| I8
    D1 -->|yes| I3
    I3 -->|yes| U3 --> B3 --> I4
    I3 -->|no| I4
    I4 --> D2
    D2 -->|reused| I8
    D2 -->|ok| I5 --> D3
    I5 --> I6 --> D4
    I6 --> I7
```
