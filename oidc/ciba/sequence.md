# CIBA — Sequence Diagram

Happy path in **poll mode**, then the ping and push delivery modes and the
expiry/denial outcomes as alternates.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client (consumption device)
    participant IdP as IdP (OpenID Provider)
    participant AuthApp as AuthApp (user's phone)

    %% --- Happy path: poll mode ---
    User->>Client: Request service (identifies self, e.g. phone number)
    Client->>IdP: POST /bc-authorize<br/>client auth (private_key_jwt),<br/>scope=openid, login_hint,<br/>binding_message="PAY-4711"
    IdP-->>Client: 200 auth_req_id, expires_in=120, interval=5
    IdP->>AuthApp: Push notification: authentication request<br/>shows client name + binding_message
    Client->>User: "Approve the request on your phone (code PAY-4711)"

    loop Poll every interval seconds
        Client->>IdP: POST /token<br/>grant_type=urn:openid:params:<br/>grant-type:ciba, auth_req_id
        IdP-->>Client: 400 error=authorization_pending
    end

    User->>AuthApp: Verify binding_message matches, authenticate<br/>(biometric / PIN), approve
    AuthApp->>IdP: Approval result (authenticated)
    Client->>IdP: POST /token (next poll)
    IdP-->>Client: 200 access_token, id_token,<br/>refresh_token
    Client->>User: Transaction proceeds

    %% --- Delivery mode alternates ---
    alt Ping mode
        Note over Client,IdP: /bc-authorize included client_notification_token
        IdP->>Client: POST client_notification_endpoint<br/>Bearer client_notification_token<br/>body: auth_req_id
        Client->>IdP: POST /token (single call, auth_req_id)
        IdP-->>Client: 200 tokens
    else Push mode
        Note over IdP: Not permitted under FAPI-CIBA
        IdP->>Client: POST client_notification_endpoint<br/>body: auth_req_id + tokens
    end

    %% --- Failure alternates ---
    alt Client polls too fast
        Client->>IdP: POST /token (before interval elapsed)
        IdP-->>Client: 400 error=slow_down
    else auth_req_id expires (user never responded)
        Client->>IdP: POST /token
        IdP-->>Client: 400 error=expired_token
        Client->>User: Request timed out - try again
    else User denies on authentication device
        User->>AuthApp: Reject request
        AuthApp->>IdP: Denial
        Client->>IdP: POST /token
        IdP-->>Client: 400 error=access_denied
    else Push undeliverable / auth failed at IdP
        Client->>IdP: POST /token
        IdP-->>Client: 400 error=transaction_failed
    end
```

Notes

- Exactly one of `login_hint`, `login_hint_token`, `id_token_hint` goes in the
  backchannel request.
- In ping/push modes the IdP authenticates its callback with the
  `client_notification_token` the client supplied.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
