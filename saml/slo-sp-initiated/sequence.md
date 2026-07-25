---
title: "SP-Initiated Single Logout — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SP-Initiated Single Logout — Sequence Diagram

Happy path: logout at SP1, IdP propagates to SP2 over the front channel, everything
succeeds. Alt blocks show back-channel SOAP propagation and the partial-logout outcome.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant SP1 as SP1
    participant IdP as IdP
    participant SP2 as SP2

    User->>Browser: Click "Logout" in SP1 app
    Browser->>SP1: GET /logout
    SP1->>SP1: Destroy local SP1 session
    SP1-->>Browser: 302 Redirect to IdP SLO endpoint<br/>signed LogoutRequest (NameID, SessionIndex)<br/>HTTP-Redirect binding
    Browser->>IdP: GET /slo?SAMLRequest=...
    IdP->>IdP: Verify signature, match NameID + SessionIndex<br/>to IdP session, list other participants: SP2
    IdP->>IdP: Terminate IdP session

    alt Front-channel propagation (HTTP-Redirect / HTTP-POST)
        IdP-->>Browser: 302 Redirect to SP2 SLO endpoint<br/>signed LogoutRequest
        Browser->>SP2: GET /slo?SAMLRequest=...
        SP2->>SP2: Verify signature, destroy SP2 session,<br/>clear SP2 session cookie
        SP2-->>Browser: 302 Redirect back to IdP<br/>LogoutResponse (Status Success)
        Browser->>IdP: GET /slo?SAMLResponse=...
    else Back-channel propagation (SOAP binding)
        IdP->>SP2: SOAP LogoutRequest to SP2 SOAP SLO endpoint
        SP2->>SP2: Verify signature, invalidate session server-side<br/>(cookie cannot be cleared on back channel)
        SP2-->>IdP: SOAP LogoutResponse (Status Success)
    end

    alt All participants logged out
        IdP-->>Browser: 302 Redirect to SP1 SLO endpoint<br/>LogoutResponse (Status Success)
        Browser->>SP1: GET /slo?SAMLResponse=...
        SP1->>SP1: Verify signature, confirm InResponseTo<br/>matches its LogoutRequest ID
        SP1-->>Browser: "You have been signed out everywhere"
        Browser-->>User: Logout confirmation
    else SP2 unreachable or returned an error
        IdP->>IdP: Record failed participant
        IdP-->>Browser: 302 Redirect to SP1 SLO endpoint<br/>LogoutResponse with second-level status<br/>PartialLogout
        Browser->>SP1: GET /slo?SAMLResponse=...
        SP1-->>Browser: "Signed out - some applications may<br/>still have active sessions"
        Browser-->>User: Partial-logout warning
    end
```

Notes

- `SessionIndex` scopes the logout to the SSO session established by a specific
  assertion; omitting it logs the `NameID` out of all sessions.
- In front-channel mode with N participants, steps 8–12 repeat once per SP before the
  IdP answers SP1.
- The IdP terminates its own session *before* propagation so that a broken chain can
  never leave the IdP session alive.
