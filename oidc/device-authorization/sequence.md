# Device Authorization Grant — Sequence Diagram

RFC 8628 device flow: a smart TV / CLI obtains tokens by having the user approve
the request on a secondary device while the client polls the token endpoint.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Device as Device (smart TV / CLI)
    participant IdP as IdP (Authorization Server)
    participant Phone as Phone (secondary browser)

    %% --- Happy path ---
    User->>Device: Start sign-in
    Device->>IdP: POST /device_authorization<br/>client_id, scope=openid profile
    IdP-->>Device: 200 device_code, user_code,<br/>verification_uri, verification_uri_complete,<br/>expires_in=1800, interval=5
    Device->>User: Display user_code + verification_uri<br/>(and QR of verification_uri_complete)

    par User authorizes on secondary device
        User->>Phone: Scan QR / browse to verification_uri
        Phone->>IdP: GET verification_uri
        IdP-->>Phone: Prompt for user_code (skipped if uri_complete)
        User->>Phone: Enter user_code
        Phone->>IdP: Submit user_code
        IdP-->>Phone: Login + consent page (client name, scopes)
        User->>Phone: Authenticate and approve
        IdP-->>Phone: "Device connected" confirmation
    and Device polls token endpoint
        loop Every interval seconds until resolved
            Device->>IdP: POST /token<br/>grant_type=urn:ietf:params:oauth:<br/>grant-type:device_code,<br/>device_code, client_id
            IdP-->>Device: 400 error=authorization_pending
        end
    end

    Device->>IdP: POST /token (poll after user approval)
    IdP-->>Device: 200 access_token, id_token,<br/>refresh_token, expires_in
    Device->>User: Signed in

    %% --- Alternate outcomes on the polling channel ---
    alt Device polls faster than interval
        Device->>IdP: POST /token (too soon)
        IdP-->>Device: 400 error=slow_down
        Note over Device: Add 5s to polling interval (RFC 8628 s3.5)
    else device_code expires before approval
        Device->>IdP: POST /token
        IdP-->>Device: 400 error=expired_token
        Device->>User: Code expired - restart to get a new code
    else User denies consent on phone
        Device->>IdP: POST /token
        IdP-->>Device: 400 error=access_denied
        Device->>User: Sign-in was declined
    end
```

Notes

- Polling and user approval genuinely overlap, hence the `par` block.
- `verification_uri_complete` lets a QR scan skip manual code entry; the IdP should
  still show client name and scopes before consent.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
