# OIDC Session Management — Swimlane

The Browser hosts both iframes and relays `postMessage`; the Client owns polling and
silent re-auth; the IdP owns the OP session cookie and `prompt=none` answers.

```mermaid
flowchart TD
    subgraph User
        U1["Logs out or switches<br/>account at the OP"]
    end

    subgraph Br["Browser (RP + OP iframes)"]
        B1["RP iframe posts<br/>client_id + session_state"]
        B2["OP iframe recomputes hash<br/>from browser-state cookie"]
        B3{"Reply value?"}
    end

    subgraph RP["Client (RP)"]
        R1["Poll on a timer"]
        R2["Continue session"]
        R3["Silent /authorize prompt=none"]
        R4["End local session, log out"]
        R5["Fall back to logout specs"]
    end

    subgraph IdP["IdP (OP)"]
        I1["Set/clear OP<br/>browser-state cookie"]
        I2{"User still<br/>logged in at OP?"}
        I3["302 code (re-auth OK)"]
        I4["error=login_required"]
    end

    U1 --> I1
    R1 --> B1 --> B2 --> B3
    B3 -->|unchanged| R2
    B3 -->|error| R5
    B3 -->|changed| R3 --> I2
    I2 -->|Yes| I3 --> R2
    I2 -->|No| I4 --> R4
```
