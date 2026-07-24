# IdP-Initiated Single Logout — Sequence Diagram

Happy path: user signs out at the IdP portal; the IdP fans out `LogoutRequest`s to both
session participants and reports success. Alt blocks contrast front-channel (redirect /
iframe) with back-channel SOAP, and show partial logout when one SP fails.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP
    participant SP1 as SP1
    participant SP2 as SP2

    User->>Browser: Click "Sign out" on IdP portal
    Browser->>IdP: GET /portal/logout
    IdP->>IdP: Identify session participants: SP1, SP2<br/>with their NameID + SessionIndex values
    IdP->>IdP: Terminate IdP session first

    alt Front-channel - sequential redirect chain
        IdP-->>Browser: 302 Redirect to SP1 SLO endpoint<br/>signed LogoutRequest (HTTP-Redirect)
        Browser->>SP1: GET /slo?SAMLRequest=...
        SP1->>SP1: Verify signature, destroy session + cookie
        SP1-->>Browser: 302 back to IdP with LogoutResponse (Success)
        Browser->>IdP: GET /slo?SAMLResponse=...
        IdP-->>Browser: 302 Redirect to SP2 SLO endpoint<br/>signed LogoutRequest
        Browser->>SP2: GET /slo?SAMLRequest=...
        SP2->>SP2: Verify signature, destroy session + cookie
        SP2-->>Browser: 302 back to IdP with LogoutResponse (Success)
        Browser->>IdP: GET /slo?SAMLResponse=...
    else Front-channel - parallel hidden iframes
        IdP-->>Browser: Logout page embedding one hidden iframe<br/>per SP SLO endpoint (HTTP-Redirect / POST)
        par SP1 iframe
            Browser->>SP1: GET /slo?SAMLRequest=...
            SP1-->>Browser: LogoutResponse via redirect to IdP
        and SP2 iframe
            Browser->>SP2: GET /slo?SAMLRequest=...
            SP2-->>Browser: LogoutResponse via redirect to IdP
        end
    else Back-channel - SOAP binding
        par SOAP fan-out
            IdP->>SP1: SOAP LogoutRequest
            SP1-->>IdP: SOAP LogoutResponse (Success)
        and
            IdP->>SP2: SOAP LogoutRequest
            SP2-->>IdP: SOAP LogoutResponse (Success)
        end
        Note over IdP,SP2: Server-side sessions invalidated -<br/>SP browser cookies remain until next request
    end

    alt All participants confirmed logout
        IdP-->>Browser: "Signed out of all applications"
        Browser-->>User: Complete-logout confirmation
    else SP2 timed out or returned an error
        IdP->>IdP: Aggregate results - PartialLogout
        IdP-->>Browser: "Signed out - could not confirm SP2 -<br/>close your browser to be safe"
        Browser-->>User: Partial-logout warning
    end
```

Notes

- There is no final `LogoutResponse` to an initiating SP — the IdP started the flow, so
  it just renders the aggregate result to the user.
- The iframe variant is faster than the chain but loses confirmations whenever browsers
  block third-party frames or cookies; treat missing responses as failures.
- Back-channel SPs must validate sessions server-side on every request, since the SLO
  could not clear the browser cookie.
