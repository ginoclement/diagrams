# Front-Channel Logout — Sequence Diagram

Happy path with two RPs logged out via iframes, then the partial-logout
alternates (blocked third-party cookies, unreachable RP).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP (OpenID Provider)
    participant RP1 as RP1 (frontchannel_logout_uri)
    participant RP2 as RP2 (frontchannel_logout_uri)

    %% --- Happy path ---
    Note over User,IdP: Logout already initiated, e.g. RP-initiated logout<br/>reached end_session_endpoint
    IdP->>IdP: Terminate SSO session,<br/>list RPs that joined it (RP1, RP2)
    IdP-->>Browser: Logout page with hidden iframes<br/>one per RP frontchannel_logout_uri

    par Iframe to RP1
        Browser->>RP1: GET /frontchannel-logout?iss=https://idp.example&sid=abc123
        RP1->>RP1: Validate iss + sid match a known session
        RP1->>RP1: Clear RP1 session (delete cookie server-side state)
        RP1-->>Browser: 200 OK (frame content, clears cookie)
    and Iframe to RP2
        Browser->>RP2: GET /frontchannel-logout?iss=https://idp.example&sid=abc123
        RP2->>RP2: Validate iss + sid, clear RP2 session
        RP2-->>Browser: 200 OK
    end

    Browser->>IdP: Frames finished loading (no status reported)
    IdP-->>Browser: Continue to post_logout_redirect_uri<br/>or IdP logged-out page
    Browser->>User: "You have been logged out everywhere" (best effort)

    %% --- Alternates ---
    alt Browser blocks third-party cookies
        Browser->>RP1: GET frontchannel_logout_uri<br/>(RP1 session cookie NOT sent - partitioned)
        RP1->>RP1: No session cookie visible - nothing to clear
        RP1-->>Browser: 200 OK (but RP1 session still alive)
        Note over Browser,RP1: PARTIAL LOGOUT - RP1 session survives<br/>until it expires or next token check fails
    else RP unreachable or frame times out
        Browser--xRP2: GET frontchannel_logout_uri (timeout / DNS error)
        Note over IdP: IdP gets no signal - it cannot retry<br/>or even detect the failure
        Note over Browser,RP2: PARTIAL LOGOUT - RP2 session survives
    else iss / sid missing but required by RP
        Browser->>RP1: GET /frontchannel-logout (no parameters)
        RP1->>RP1: frontchannel_logout_session_required=true<br/>reject as possible logout CSRF
        RP1-->>Browser: 400 ignored - session unchanged
    end
```

Notes

- The IdP renders all frames in parallel and proceeds after a fixed timeout; there is
  no acknowledgement channel from RPs.
- `iss` and `sid` must be sent together or not at all; RPs compare `sid` to the ID
  token's `sid` claim.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
