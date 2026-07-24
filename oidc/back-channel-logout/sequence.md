# Back-Channel Logout — Sequence Diagram

Happy path: IdP POSTs a logout token to each RP in the terminated session; RPs
validate and destroy sessions. Alternates: RP endpoint down with retry, invalid
logout token rejected.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (OpenID Provider)
    participant RP1 as RP1 (backchannel_logout_uri)
    participant RP2 as RP2 (backchannel_logout_uri)

    %% --- Happy path ---
    User->>Browser: Log out (or admin revokes session)
    Browser->>IdP: Logout request reaches IdP<br/>(e.g. via end_session_endpoint)
    IdP->>IdP: Terminate SSO session sid=abc123<br/>enumerate RPs: RP1, RP2
    IdP->>IdP: Mint logout_token per RP - JWT with<br/>iss, aud=client_id, iat, exp, jti,<br/>events={backchannel-logout}, sub, sid

    par Deliver to RP1
        IdP->>RP1: POST /backchannel-logout<br/>logout_token=eyJ... (form-encoded)
        RP1->>RP1: Validate signature via IdP jwks_uri
        RP1->>RP1: Check iss, aud, iat, exp,<br/>events claim, no nonce, jti unseen
        RP1->>RP1: Find session by sid, destroy it,<br/>revoke refresh tokens
        RP1-->>IdP: 200 OK
    and Deliver to RP2
        IdP->>RP2: POST /backchannel-logout<br/>logout_token=eyJ...
        RP2->>RP2: Validate logout_token, destroy session
        RP2-->>IdP: 200 OK
    end

    IdP-->>Browser: Logout complete page / redirect
    Note over User,RP2: Next request to RP1/RP2 with old cookie<br/>finds no session - user must re-authenticate

    %% --- Alternates ---
    alt RP endpoint down - retry with backoff
        IdP->>RP2: POST /backchannel-logout
        RP2--xIdP: Connection refused / 504
        IdP->>IdP: Queue delivery, schedule retry<br/>(exponential backoff, capped attempts)
        Note over RP2: RP2 session survives until retry lands<br/>or session/token lifetime expires
        IdP->>RP2: POST /backchannel-logout (retry)
        RP2-->>IdP: 200 OK - session destroyed late
    else Invalid logout_token rejected
        IdP->>RP1: POST /backchannel-logout<br/>logout_token (bad aud / missing events / has nonce)
        RP1->>RP1: Validation fails
        RP1-->>IdP: 400 Bad Request<br/>(no cache headers, session unchanged)
        Note over RP1: Correct behavior - never act on<br/>an unvalidated logout_token
    else sid not found at RP
        IdP->>RP1: POST /backchannel-logout (sid=stale999)
        RP1->>RP1: No matching session -<br/>already logged out
        RP1-->>IdP: 200 OK (idempotent)
    end
```

Notes

- The logout token is validated like an ID token except: no `nonce` allowed, and the
  `events` claim is mandatory.
- Delivery is at-least-once; RP handlers must be idempotent (`jti` cache, tolerant of
  unknown `sid`).

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
