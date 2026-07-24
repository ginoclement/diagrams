# ECP Profile — Swimlane Diagram

Lanes for User, Client, SP, IdP. The Client lane is unusually busy — in ECP the client
performs work a browser never does: SOAP parsing, IdP selection, direct authentication,
and the anti-MITM URL comparison.

```mermaid
flowchart TD
    subgraph User
        U1["Request resource in app"]
        U2["Provide IdP credentials<br/>(prompt or keychain)"]
        U3(["Receive resource"])
    end

    subgraph Client
        C1["GET resource with PAOS headers<br/>(Accept: application/vnd.paos+xml)"]
        C2["Parse SOAP envelope, store<br/>responseConsumerURL + ecp:RelayState"]
        C3["Select IdP from ecp:Request list"]
        C4["POST SOAP AuthnRequest to IdP<br/>with HTTP Basic authorization"]
        C5{"AssertionConsumerServiceURL =<br/>responseConsumerURL?"}
        C6["POST SAML Response to ACS URL<br/>as PAOS request, RelayState restored"]
        C7(["Abort: send SOAP fault to SP,<br/>discard assertion"])
    end

    subgraph SP
        S1["Detect ECP support via headers"]
        S2["Return SOAP envelope in HTTP response:<br/>paos:Request + ecp:Request + AuthnRequest"]
        S3["Validate Response: signature,<br/>Audience, Conditions, InResponseTo"]
        S4["Create session,<br/>serve protected resource"]
    end

    subgraph IdP
        I1{"HTTP Basic credentials<br/>valid?"}
        I2["Build signed Response,<br/>wrap with ecp:Response header<br/>(AssertionConsumerServiceURL)"]
        I3(["401 Unauthorized / SOAP fault"])
    end

    U1 --> C1 --> S1 --> S2 --> C2 --> C3 --> C4
    U2 --> C4
    C4 --> I1
    I1 -->|Yes| I2 --> C5
    I1 -->|No| I3 -.->|"retry with new credentials"| U2
    C5 -->|Match| C6 --> S3 --> S4 --> U3
    C5 -->|Mismatch| C7
```

Notes

- No Browser lane exists — the Client replaces it and adds the trust decisions
  (`C5`) the browser profile delegates to the SP/IdP.
- The `I3` retry loop is bounded by client policy; see [flowchart.md](flowchart.md)
  for the give-up terminal.
