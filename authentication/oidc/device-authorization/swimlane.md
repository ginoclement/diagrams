---
title: "Device Authorization Grant — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Authorization Grant — Swimlane Diagram

One lane per actor; arrows crossing lanes are handoffs between the constrained
device, the user, the secondary browser device, and the IdP.

```mermaid
flowchart TD
    subgraph User
        U1[Start sign-in on device]
        U2["Read user_code / scan QR"]
        U3[Authenticate and approve consent]
    end

    subgraph Device["Device (smart TV / CLI)"]
        D1["POST /device_authorization<br/>(client_id, scope)"]
        D2["Show user_code + verification_uri<br/>(QR of verification_uri_complete)"]
        D3["Poll POST /token<br/>(grant_type=device_code)"]
        D4{"Token response?"}
        D5([Signed in - tokens stored])
        D6([Failed - restart flow])
    end

    subgraph Phone["Phone (secondary browser)"]
        P1[Open verification_uri]
        P2[Enter user_code]
        P3[Show login + consent page]
        P4["Show 'device connected'"]
    end

    subgraph IdP["IdP (Authorization Server)"]
        I1["Issue device_code, user_code,<br/>expires_in, interval"]
        I2[Validate user_code]
        I3[Authenticate user, record consent]
        I4["Answer poll: pending / slow_down /<br/>expired / denied / tokens"]
    end

    U1 --> D1 --> I1 --> D2
    D2 --> U2 --> P1 --> P2 --> I2 --> P3 --> U3 --> I3 --> P4
    D2 --> D3 --> I4 --> D4
    D4 -->|authorization_pending or slow_down| D3
    D4 -->|"200 tokens (after consent)"| D5
    D4 -->|expired_token or access_denied| D6
    I3 -. marks device_code approved .-> I4
```

Related: [README](./README.md) | [Sequence](./sequence.md) | [Flowchart](./flowchart.md)
