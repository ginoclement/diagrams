# ECP Profile — Decision Flowchart

Decision gates across all three parties: SP capability negotiation, IdP authentication
with bounded retries, the client's mandatory URL-match check, and SP assertion
validation.

```mermaid
flowchart TD
    Start(["Client requests SP resource"]) --> Hdr{"SP: PAOS + ECP headers<br/>present in request?"}
    Hdr -->|No| Web(["Fall back to browser SSO<br/>or return 401"])
    Hdr -->|Yes| Sess{"SP: existing valid<br/>session for client?"}
    Sess -->|Yes| Serve(["Serve resource"])
    Sess -->|No| Envelope["SP: return SOAP envelope with<br/>AuthnRequest, paos:Request<br/>(responseConsumerURL), ecp:Request"]

    Envelope --> Pick{"Client: usable IdP in<br/>ecp:Request list?"}
    Pick -->|No| ErrNoIdP(["Abort: no trusted IdP available"])
    Pick -->|Yes| Creds["Client: obtain credentials<br/>(prompt user or keychain)"]
    Creds --> Auth["POST SOAP AuthnRequest to IdP ECP endpoint<br/>with HTTP Basic authorization"]

    Auth --> Ok{"IdP: credentials valid?"}
    Ok -->|No| Retry{"Client: retry<br/>attempts left?"}
    Retry -->|Yes| Creds
    Retry -->|No| ErrAuth(["Abort: authentication failed at IdP"])
    Ok -->|Yes| Issue["IdP: signed Response +<br/>ecp:Response header with<br/>AssertionConsumerServiceURL"]

    Issue --> Match{"Client: AssertionConsumerServiceURL<br/>equals responseConsumerURL?"}
    Match -->|No| Fault["Send SOAP fault to SP,<br/>discard assertion"] --> ErrMitm(["Abort: possible MITM / rogue SP"])
    Match -->|Yes| Deliver["POST Response to ACS URL<br/>(PAOS, RelayState restored)"]

    Deliver --> Valid{"SP: Response valid?<br/>signature, Issuer, Audience,<br/>Conditions, InResponseTo"}
    Valid -->|No| ErrAssert(["403: assertion rejected"])
    Valid -->|Yes| Create["SP: create session"] --> Serve
```

Notes

- The `Match` gate is the profile's signature security control: only the client can
  detect that the SP that started the flow is not the SP the IdP addressed.
- Credential retries must be bounded and rate-limited client-side; the IdP should also
  throttle its ECP endpoint (Basic-auth endpoints attract password spraying).
- The `Hdr -> No` branch is how one URL serves both browsers and ECP clients: content
  negotiation via the `Accept`/`PAOS` headers.
