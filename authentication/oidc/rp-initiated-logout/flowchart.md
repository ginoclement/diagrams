---
title: "RP-Initiated Logout — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RP-Initiated Logout — Decision Flowchart

IdP-side decision logic for a request to the `end_session_endpoint`, with the
RP's local-session teardown up front.

```mermaid
flowchart TD
    S([User clicks Log out at RP]) --> A["RP destroys local session"]
    A --> B["302 to end_session_endpoint<br/>?id_token_hint&post_logout_redirect_uri&state"]
    B --> C{"id_token_hint present<br/>and signature + aud valid?"}

    C -->|yes| D{"Hint matches current<br/>IdP session (sub / sid)?"}
    C -->|no| P["Show logout confirmation prompt"]
    P --> Q{"User confirms?"}
    Q -->|no| E1([Cancelled - IdP session intact])
    Q -->|yes| T

    D -->|no| P
    D -->|yes| T["Terminate IdP SSO session,<br/>clear IdP session cookie"]

    T --> F["Trigger logout propagation to other RPs<br/>(front-channel / back-channel)"]
    F --> G{"post_logout_redirect_uri supplied?"}
    G -->|no| H([Show IdP logged-out page])
    G -->|yes| I{"Exact match against registered<br/>post_logout_redirect_uris<br/>and RP identified via hint or client_id?"}
    I -->|no| J(["Logged out - but show IdP page,<br/>never redirect to unregistered URI"])
    I -->|yes| K["302 to post_logout_redirect_uri?state=..."]
    K --> L{"RP: state matches?"}
    L -->|yes| OK([Logged out - RP shows confirmation])
    L -->|no| E2([RP ignores mismatched return -<br/>possible forged callback])
```

Notes

- The unregistered-URI branch still logs the user out; only the redirect is refused.
- Forced-logout CSRF is contained by the confirmation prompt on the no-hint path.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
