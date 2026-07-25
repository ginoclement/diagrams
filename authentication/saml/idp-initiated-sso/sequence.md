---
title: "IdP-Initiated SSO — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP-Initiated SSO — Sequence Diagram

Happy path: user clicks an app tile on the IdP portal and the IdP posts an unsolicited
`Response` to the SP ACS URL. Alternates: SP policy rejects unsolicited responses, and
replay of a previously consumed assertion.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant IdP as IdP
    participant SP as SP

    User->>Browser: Open IdP portal
    Browser->>IdP: GET /portal
    alt No IdP session yet
        IdP-->>Browser: Login page
        User->>Browser: Enter credentials + MFA
        Browser->>IdP: POST credentials
        IdP->>IdP: Authenticate, create IdP session
    else Existing IdP session
        IdP->>IdP: Session cookie valid - portal loads directly
    end
    IdP-->>Browser: Portal page with app tiles

    User->>Browser: Click SP app tile
    Browser->>IdP: GET /portal/launch/sp-app
    IdP->>IdP: Build unsolicited Response + signed Assertion<br/>NO InResponseTo attribute<br/>RelayState = configured deep-link target
    IdP-->>Browser: HTML form auto-POST to SP ACS URL<br/>SAMLResponse + RelayState (HTTP-POST binding)
    Browser->>SP: POST /saml/acs (SAMLResponse, RelayState)

    alt SP accepts unsolicited responses (policy allows)
        SP->>SP: Validate signature, Issuer, Destination,<br/>Audience, Conditions
        SP->>SP: Check assertion ID against replay cache
        alt First presentation of this assertion
            SP->>SP: Mark assertion ID consumed,<br/>create SP session
            SP->>SP: Validate RelayState as allow-listed local URL
            SP-->>Browser: 302 Redirect to deep-link target
            Browser->>SP: GET /app/deep-link (SP session cookie)
            SP-->>Browser: 200 Requested page
            Browser-->>User: Signed-in at deep-link destination
        else Assertion ID already consumed (replay detected)
            SP->>SP: Reject - duplicate assertion ID<br/>within validity window
            SP-->>Browser: Error page "Response replayed"
        end
    else SP rejects unsolicited responses (SP-initiated only)
        SP->>SP: Response has no InResponseTo and<br/>unsolicited SSO is disabled by policy
        SP-->>Browser: 302 Redirect into SP-initiated SSO<br/>(new AuthnRequest to IdP)
        Note over Browser,SP: Continues as SP-initiated SSO -<br/>see ../sp-initiated-sso/sequence.md
    end
```

Notes

- There is no `AuthnRequest` anywhere in the happy path — the `Response` is unsolicited
  by definition, which is why `InResponseTo` is absent.
- The rejection branch shows the common graceful fallback: bounce the user into
  SP-initiated SSO instead of a hard error.
- Replay protection rests entirely on the assertion-ID cache and the short
  `NotOnOrAfter` window, since request correlation is unavailable.
