# ECP Profile — Sequence Diagram

Happy path: an ECP-capable client fetches a protected SP resource via the reverse-SOAP
(PAOS) exchange, authenticating to the IdP with HTTP Basic. Alt blocks: Basic-auth
failure at the IdP, and the mandatory `responseConsumerURL` mismatch abort.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as ECP Client
    participant SP as SP
    participant IdP as IdP

    User->>Client: Launch app / request federated resource
    Client->>SP: GET /resource<br/>Accept: application/vnd.paos+xml<br/>PAOS: ver + ECP service URN
    SP->>SP: No session - client is ECP-capable
    SP-->>Client: 200 SOAP envelope (PAOS response):<br/>paos:Request (responseConsumerURL),<br/>ecp:Request (IdP list), ecp:RelayState,<br/>AuthnRequest

    Client->>Client: Select IdP from ecp:Request list,<br/>keep responseConsumerURL + RelayState
    User->>Client: Provide IdP credentials (or use stored)
    Client->>IdP: POST SOAP AuthnRequest to ECP<br/>SingleSignOnService endpoint<br/>Authorization: Basic base64(user:pass)

    alt Basic authentication succeeds
        IdP->>IdP: Validate credentials against Directory,<br/>build signed Response for the SP
        IdP-->>Client: 200 SOAP envelope:<br/>ecp:Response header (AssertionConsumerServiceURL),<br/>SAML Response + Assertion
        Client->>Client: Compare AssertionConsumerServiceURL<br/>with responseConsumerURL from SP
        alt URLs match (no MITM)
            Client->>SP: POST Response to ACS URL<br/>Content-Type: application/vnd.paos+xml<br/>ecp:RelayState restored
            SP->>SP: Validate signature, Issuer, Audience,<br/>Conditions, InResponseTo
            alt Assertion valid
                SP-->>Client: 200 Protected resource<br/>(plus SP session token/cookie)
                Client-->>User: Resource delivered
            else Assertion invalid
                SP-->>Client: SOAP fault / 403 Forbidden
                Client-->>User: Access denied
            end
        else URL mismatch (possible MITM by rogue SP)
            Client->>SP: SOAP fault to responseConsumerURL:<br/>"AssertionConsumerServiceURL mismatch"
            Client->>Client: Abort - do NOT deliver assertion
            Client-->>User: Security error - flow aborted
        end
    else Basic authentication fails at IdP
        IdP-->>Client: 401 Unauthorized (or SOAP fault<br/>with AuthnFailed status)
        Client-->>User: Prompt to re-enter credentials
        opt Retry limit exceeded
            Client-->>User: Authentication failed - giving up
        end
    end
```

Notes

- Steps 2–4 are "reverse SOAP": the SOAP request (`AuthnRequest`) travels inside an
  HTTP *response* to the client — that inversion is what PAOS provides.
- The client is an active protocol participant (unlike a browser): it parses SOAP,
  selects the IdP, authenticates directly, and enforces the URL-match check.
- `ecp:RelayState` from step 4 must be returned verbatim in step 12 so the SP can
  restore request context.
