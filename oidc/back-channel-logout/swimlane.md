---
title: "Back-Channel Logout — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Back-Channel Logout — Swimlane Diagram

One lane per actor. Note the browser lane goes quiet after triggering logout —
propagation happens entirely server-to-server.

```mermaid
flowchart TD
    subgraph User
        U1["Log out / admin revokes session"]
        U2["Later: revisit RP -<br/>must re-authenticate"]
    end

    subgraph Browser
        B1["Deliver logout to IdP<br/>(end_session_endpoint)"]
        B2["Show logged-out page"]
    end

    subgraph IdP["IdP (OpenID Provider)"]
        I1["Terminate SSO session sid"]
        I2["Enumerate RPs in session"]
        I3["Mint logout_token per RP<br/>(iss, aud, iat, exp, jti,<br/>events, sub, sid)"]
        I4["POST logout_token to each<br/>backchannel_logout_uri"]
        I5{"Delivery response?"}
        I6["Queue + retry with backoff"]
        I7([Propagation complete])
    end

    subgraph RP1["RP1"]
        R1["Validate logout_token<br/>(signature, iss, aud, events,<br/>no nonce, jti unseen)"]
        R2{"Valid?"}
        R3["Destroy session by sid,<br/>revoke refresh tokens"]
        R4["Return 200 OK"]
        R5["Return 400 Bad Request<br/>- session unchanged"]
    end

    subgraph RP2["RP2"]
        S1["Endpoint down at first attempt"]
        S2["Retry arrives - validate,<br/>destroy session, 200 OK"]
    end

    U1 --> B1 --> I1 --> I2 --> I3 --> I4
    I4 --> R1 --> R2
    R2 -->|yes| R3 --> R4 --> I5
    R2 -->|no| R5 --> I5
    I4 --> S1 --> I5
    I5 -->|"5xx / timeout"| I6 --> S2 --> I7
    I5 -->|"200 or final 400"| I7
    I1 --> B2
    B2 --> U2
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
