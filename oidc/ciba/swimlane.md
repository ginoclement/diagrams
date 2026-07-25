---
title: "CIBA — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# CIBA — Swimlane Diagram

Poll-mode happy path with the ping-mode shortcut shown as a dashed handoff.
One lane per actor.

```mermaid
flowchart TD
    subgraph User
        U1["Identify self at consumption device<br/>(e.g. gives phone number)"]
        U2["Compare binding_message,<br/>authenticate, approve or deny"]
    end

    subgraph Client["Client (consumption device)"]
        C1["POST /bc-authorize<br/>(login_hint, scope=openid,<br/>binding_message)"]
        C2["Show 'approve on your phone'<br/>+ binding_message"]
        C3["Poll POST /token<br/>(grant_type=ciba, auth_req_id)"]
        C4{"Token response?"}
        C5([Tokens received - proceed])
        C6(["Failed - denied / expired"])
        C7["Ping mode: receive auth_req_id<br/>on client_notification_endpoint"]
    end

    subgraph IdP["IdP (OpenID Provider)"]
        I1["Validate client + hint,<br/>issue auth_req_id, interval"]
        I2["Send push challenge<br/>to registered device"]
        I3["Record approval / denial"]
        I4["Answer poll: pending /<br/>tokens / error"]
    end

    subgraph AuthApp["AuthApp (user's phone)"]
        A1["Display request: client name,<br/>scopes, binding_message"]
        A2["Return result to IdP"]
    end

    U1 --> C1 --> I1 --> I2 --> A1
    I1 --> C2
    A1 --> U2 --> A2 --> I3
    C2 --> C3 --> I4 --> C4
    C4 -->|"authorization_pending / slow_down"| C3
    C4 -->|"200 tokens"| C5
    C4 -->|"access_denied / expired_token /<br/>transaction_failed"| C6
    I3 -. approval unlocks token issuance .-> I4
    I3 -. "ping mode - notify client" .-> C7
    C7 -. "single /token call" .-> I4
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
