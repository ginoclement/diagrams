# RP-Initiated Logout — Swimlane Diagram

One lane per actor; the propagation hand-off to other RPs is shown as a dashed
exit to the front-/back-channel diagrams.

```mermaid
flowchart TD
    subgraph User
        U1["Click 'Log out' in the RP"]
        U2["Confirm logout if prompted"]
    end

    subgraph Browser
        B1["GET /logout at RP"]
        B2["Follow 302 to end_session_endpoint<br/>(carries IdP session cookie)"]
        B3["Follow 302 back to<br/>post_logout_redirect_uri"]
        B4["Render logged-out page"]
    end

    subgraph Client["Client (RP)"]
        C1["Destroy local session,<br/>clear RP session cookie"]
        C2["Redirect with id_token_hint,<br/>post_logout_redirect_uri, state"]
        C3["Verify returned state"]
        C4([RP + IdP sessions ended])
    end

    subgraph IdP["IdP (OpenID Provider)"]
        I1["Validate id_token_hint<br/>(signature, aud, session match)"]
        I2{"post_logout_redirect_uri<br/>registered for client?"}
        I3["Terminate SSO session,<br/>clear IdP cookie"]
        I4["302 to post_logout_redirect_uri<br/>+ state"]
        I5["Show IdP logged-out page<br/>(no redirect to unregistered URI)"]
        I6["Propagate to other RPs<br/>(front-channel / back-channel logout)"]
    end

    U1 --> B1 --> C1 --> C2 --> B2 --> I1
    I1 -->|hint missing or invalid| U2
    U2 -->|confirms| I3
    I1 -->|valid| I2
    I2 --> I3
    I3 -->|URI registered| I4 --> B3 --> C3 --> B4
    I3 -->|URI missing or unregistered| I5
    C3 --> C4
    I3 -.-> I6
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
