# Device Authorization Grant — Decision Flowchart

Decision logic on the device side, including every RFC 8628 token-endpoint
error code and its handling.

```mermaid
flowchart TD
    S([User starts sign-in on device]) --> A["POST /device_authorization<br/>(client_id, scope)"]
    A --> B{"Request accepted?"}
    B -->|"400 invalid_client / invalid_scope"| E1([Error - fix client config])
    B -->|200| C["Display user_code + verification_uri<br/>start countdown from expires_in"]
    C --> D["Wait interval seconds"]
    D --> P["POST /token<br/>grant_type=urn:ietf:params:oauth:<br/>grant-type:device_code"]
    P --> R{"Token endpoint response?"}

    R -->|"200 OK"| T["Validate id_token<br/>(iss, aud, exp, signature)"]
    T --> V{"id_token valid?"}
    V -->|yes| OK([Signed in - store tokens])
    V -->|no| E2([Reject tokens - abort flow])

    R -->|"400 authorization_pending"| D
    R -->|"400 slow_down"| SL["interval = interval + 5s"] --> D
    R -->|"400 expired_token"| EX{"Restart flow?"}
    EX -->|user retries| A
    EX -->|user gives up| E3([Abandoned - no session])
    R -->|"400 access_denied"| E4([User declined consent])
    R -->|"400 invalid_grant<br/>(unknown device_code)"| E5([Fatal - restart flow])
```

Notes

- `slow_down` is the only error that mutates polling state; everything else either
  loops unchanged (`authorization_pending`) or terminates.
- The device must stop polling once `expires_in` has elapsed locally even if it
  never sees `expired_token`.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
