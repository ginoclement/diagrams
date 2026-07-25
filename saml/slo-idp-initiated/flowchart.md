---
title: "IdP-Initiated Single Logout — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP-Initiated Single Logout — Decision Flowchart

IdP-side logic: session lookup, mandatory self-termination first, per-SP binding
selection, timeout handling, and aggregation into a complete- or partial-logout result.

```mermaid
flowchart TD
    Start(["User clicks Sign out at IdP portal"]) --> HasSess{"Live IdP<br/>session?"}
    HasSess -->|No| Already(["Show: already signed out"])
    HasSess -->|Yes| List["Enumerate session participants<br/>(SPs with NameID + SessionIndex)"]
    List --> KillIdP["Terminate IdP session FIRST<br/>(prevents SSO resurrection)"]

    KillIdP --> Any{"Any participant<br/>SPs?"}
    Any -->|No| DoneSimple(["Show: signed out"])
    Any -->|Yes| Loop{"Next SP<br/>to notify?"}

    Loop -->|Yes| Bind{"SP SLO binding<br/>from metadata?"}
    Bind -->|"HTTP-Redirect / POST<br/>(front-channel)"| FC["Send signed LogoutRequest<br/>via Browser redirect or hidden iframe"]
    Bind -->|"SOAP<br/>(back-channel)"| BC["Send SOAP LogoutRequest<br/>server-to-server"]
    Bind -->|"None registered"| NoEp["Cannot notify SP"] --> MarkFail

    FC --> FcOk{"LogoutResponse Success<br/>within timeout?"}
    BC --> BcOk{"SOAP LogoutResponse<br/>Success?"}
    FcOk -->|Yes| MarkOK["Mark SP terminated"] --> Loop
    BcOk -->|Yes| MarkOK
    FcOk -->|"No - blocked iframe,<br/>timeout, or error"| MarkFail["Mark SP unconfirmed"] --> Loop
    BcOk -->|"No - unreachable<br/>or error status"| MarkFail

    Loop -->|"No more"| Agg{"All SPs<br/>confirmed?"}
    Agg -->|Yes| Full(["Result page:<br/>signed out of all applications"])
    Agg -->|No| Partial(["Result page: PARTIAL logout -<br/>list unconfirmed SPs,<br/>advise closing the browser"])
```

Notes

- `KillIdP` before the loop is the key ordering rule: even if every notification
  fails, seamless SSO can no longer re-mint SP sessions.
- SPs with no registered SLO endpoint are a silent gap — flag them at onboarding time,
  not at logout time.
- Front-channel confirmations that never arrive must be treated as failures, not
  successes; browsers give no error signal for blocked third-party frames.
