---
title: "RP-Initiated Logout — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RP-Initiated Logout — Sequence Diagram

Happy path first (valid `id_token_hint`, registered `post_logout_redirect_uri`),
then confirmation-prompt and invalid-redirect alternates.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Client as Client (RP)
    participant IdP as IdP (OpenID Provider)

    %% --- Happy path ---
    User->>Browser: Click "Log out"
    Browser->>Client: GET /logout
    Client->>Client: Destroy local session<br/>(clear session cookie / server state)
    Client-->>Browser: 302 to end_session_endpoint<br/>?id_token_hint=eyJ...<br/>&post_logout_redirect_uri=https://rp.example/loggedout<br/>&state=af0ifjsldkj
    Browser->>IdP: GET /end_session (with IdP session cookie)
    IdP->>IdP: Validate id_token_hint signature + aud,<br/>match to current session (sid/sub)
    IdP->>IdP: Verify post_logout_redirect_uri is<br/>registered for this client (exact match)
    IdP->>IdP: Terminate SSO session,<br/>clear IdP session cookie

    opt Propagate logout to other RPs in this SSO session
        Note over IdP,Browser: Front-channel iframes and/or back-channel<br/>logout_token POSTs - see front-channel-logout<br/>and back-channel-logout diagrams
    end

    IdP-->>Browser: 302 to post_logout_redirect_uri?state=af0ifjsldkj
    Browser->>Client: GET /loggedout?state=af0ifjsldkj
    Client->>Client: Verify state matches
    Client-->>Browser: "You have been logged out" page

    %% --- Alternates ---
    alt No or invalid id_token_hint - confirmation prompt
        Browser->>IdP: GET /end_session (no id_token_hint)
        IdP-->>Browser: Render "Do you want to log out?" prompt
        alt User confirms
            User->>Browser: Click "Yes, log out"
            Browser->>IdP: POST confirmation
            IdP->>IdP: Terminate SSO session
            IdP-->>Browser: IdP logged-out page<br/>(redirect only if RP identified + URI registered)
        else User cancels
            User->>Browser: Click "Cancel"
            IdP-->>Browser: Return to app - IdP session intact
        end
    else post_logout_redirect_uri not registered
        Browser->>IdP: GET /end_session<br/>?post_logout_redirect_uri=https://evil.example
        IdP->>IdP: Exact-match check fails
        IdP->>IdP: Still terminate SSO session (logout honored)
        IdP-->>Browser: Show IdP logged-out page -<br/>NO redirect to unregistered URI
    end
```

Notes

- The RP kills its own session before redirecting, so logout holds even if the user
  never completes the IdP leg.
- An unregistered `post_logout_redirect_uri` downgrades the UX (no return redirect)
  but must never become an open redirect.

Related: [README](./README.md) | [Swimlane](./swimlane.md) | [Flowchart](./flowchart.md)
