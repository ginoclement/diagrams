---
title: "SP-Initiated SSO — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SP-Initiated SSO — Sequence Diagram

Happy path first (fresh IdP login), then alternates: seamless SSO with an existing IdP
session, authentication failure, invalid/expired assertion, `ForceAuthn`, and signed
`AuthnRequest`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant SP as SP
    participant IdP as IdP

    User->>Browser: Navigate to protected SP resource
    Browser->>SP: GET /app/reports
    SP->>SP: No local session found
    SP->>SP: Build AuthnRequest, store request ID + RelayState
    SP-->>Browser: 302 Redirect to IdP SSO endpoint<br/>SAMLRequest + RelayState (HTTP-Redirect binding)
    Browser->>IdP: GET /sso/saml?SAMLRequest=...&RelayState=...
    IdP->>IdP: Decode and validate AuthnRequest<br/>(Issuer, ACS URL vs metadata)

    opt Signed AuthnRequest (IdP requires request signing)
        IdP->>IdP: Verify Signature / SigAlg over SAMLRequest<br/>using SP signing certificate from metadata
    end

    alt No IdP session - interactive login
        IdP-->>Browser: Login page
        User->>Browser: Enter credentials (and MFA if required)
        Browser->>IdP: POST credentials
        IdP->>IdP: Authenticate user, create IdP session cookie
    else Existing IdP session (seamless SSO)
        IdP->>IdP: Valid IdP session cookie found - skip login UI
    else ForceAuthn="true" in AuthnRequest
        IdP->>IdP: Ignore existing session, re-challenge user
        IdP-->>Browser: Login page (fresh authentication required)
        User->>Browser: Re-enter credentials
        Browser->>IdP: POST credentials
    end

    alt Authentication succeeded
        IdP->>IdP: Build Response + signed Assertion<br/>(InResponseTo = request ID, Audience = SP entityID)
        IdP-->>Browser: HTML form auto-POST to ACS URL<br/>SAMLResponse + RelayState (HTTP-POST binding)
        Browser->>SP: POST /saml/acs (SAMLResponse, RelayState)
        SP->>SP: Validate signature, Issuer, Destination,<br/>Audience, Conditions, InResponseTo, replay
        alt Assertion valid
            SP->>SP: Create SP session, map NameID to local user
            SP-->>Browser: 302 Redirect to RelayState target
            Browser->>SP: GET /app/reports (with SP session cookie)
            SP-->>Browser: 200 Protected resource
            Browser-->>User: Signed-in application page
        else Assertion invalid or expired
            SP->>SP: Reject - bad signature, stale NotOnOrAfter,<br/>wrong Audience, or unknown InResponseTo
            SP-->>Browser: Error page "SSO failed - assertion rejected"
        end
    else Authentication failed at IdP
        IdP-->>Browser: Auto-POST Response with Status<br/>urn...status:Responder / AuthnFailed (no Assertion)
        Browser->>SP: POST /saml/acs (SAMLResponse)
        SP-->>Browser: Error page "Authentication failed at IdP"
    end
```

Notes

- Steps 5–6 are the HTTP-Redirect binding: `AuthnRequest` is DEFLATE-compressed,
  base64-encoded, and URL-encoded into the `SAMLRequest` parameter.
- The auto-POST in the success branch is the HTTP-POST binding: a self-submitting HTML
  form carrying `SAMLResponse` and the unchanged `RelayState`.
- Replay protection: the SP marks the `InResponseTo` ID consumed and caches the
  assertion ID until `NotOnOrAfter`.
