# Password Expiry and Rotation — Swimlane

One lane per actor. Steps sit in the lane of the actor performing them; arrows
cross lanes at handoffs.

```mermaid
flowchart TD
    subgraph User
        U1["Enter username + password"]
        U2["Enter new password + confirm"]
    end

    subgraph Browser
        B1["POST /login"]
        B2["Render forced-change form"]
        B3["POST /login/change"]
    end

    subgraph IdP
        I1{"Credentials valid?"}
        I2{"Password expired or<br/>must-change set?"}
        I3{"Grace logins left?"}
        I4["Grant session +<br/>expiry banner"]
        I5["Withhold session,<br/>force change"]
        I6{"New password OK?<br/>policy + history + breach"}
        I7["Grant session"]
        I8["Reject bad credentials"]
        I9["Reject weak/reused password"]
    end

    subgraph Directory
        D1["Verify hash, read age<br/>+ must-change + grace counter"]
        D2["Decrement grace counter"]
        D3["Store new hash, clear<br/>must-change, reset age"]
    end

    U1 --> B1 --> I1
    I1 --> D1
    D1 -->|invalid| I8
    D1 -->|valid| I2
    I2 -->|no| I4
    I2 -->|yes| I3
    I3 -->|yes| D2 --> I4
    I3 -->|no| I5 --> B2 --> U2
    U2 --> B3 --> I6
    I6 -->|no| I9
    I6 -->|yes| D3 --> I7
```
