---
title: "CIBA — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# CIBA — Decision Flowchart

Client-side decision logic across the three token delivery modes, with explicit
error terminals for every CIBA error code.

```mermaid
flowchart TD
    S([Client needs to authenticate a known user]) --> A["POST /bc-authorize<br/>(client auth, login_hint,<br/>scope=openid, binding_message)"]
    A --> B{"Backchannel request accepted?"}
    B -->|"400 unknown_user_id"| E1([Error - hint matches no user])
    B -->|"400 invalid_request /<br/>401 invalid_client"| E2([Error - fix request or client auth])
    B -->|"200 auth_req_id"| M{"Registered delivery mode?"}

    M -->|poll| W["Wait interval seconds"]
    W --> P["POST /token<br/>(grant_type=ciba, auth_req_id)"]
    P --> R{"Response?"}
    R -->|authorization_pending| W
    R -->|slow_down| SL["interval = interval + 5s"] --> W
    R -->|"200 tokens"| V
    R -->|expired_token| E3([Timed out - auth_req_id expired])
    R -->|access_denied| E4([User denied the request])
    R -->|transaction_failed| E5([IdP could not complete challenge])

    M -->|ping| N["Wait for POST to<br/>client_notification_endpoint"]
    N --> N1{"client_notification_token valid?"}
    N1 -->|no| E6([Reject notification - possible spoof])
    N1 -->|yes| P

    M -->|"push (non-FAPI only)"| Q["Tokens arrive in notification body"]
    Q --> V["Validate id_token<br/>(iss, aud, exp, signature,<br/>auth_req_id hash if present)"]
    V --> V1{"id_token valid?"}
    V1 -->|yes| OK([Authenticated - proceed with transaction])
    V1 -->|no| E7([Reject tokens - abort])
```

Notes

- Ping mode still requires a `/token` call; only push mode delivers tokens directly,
  which is why FAPI-CIBA forbids it.
- On `expired_token` the client may retry with a fresh `/bc-authorize`, but should
  rate-limit to avoid push-bombing the user.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
