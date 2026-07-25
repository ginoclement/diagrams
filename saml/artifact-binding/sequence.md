---
title: "HTTP-Artifact Binding — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HTTP-Artifact Binding — Sequence Diagram

Happy path: SP-initiated SSO where the IdP returns an artifact by redirect and the SP
resolves it over back-channel SOAP at the Artifact Resolution Service (ARS). Alt
blocks: expired artifact and already-dereferenced (replayed) artifact.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant SP as SP
    participant IdP as IdP
    participant ARS as IdP Artifact Resolution Svc

    User->>Browser: Navigate to protected SP resource
    Browser->>SP: GET /app
    SP-->>Browser: 302 Redirect to IdP SSO endpoint<br/>SAMLRequest + RelayState (HTTP-Redirect)
    Browser->>IdP: GET /sso/saml?SAMLRequest=...
    IdP->>IdP: Authenticate user<br/>(or reuse existing IdP session)
    IdP->>IdP: Build Response + Assertion, store it,<br/>mint one-time artifact (SourceID + MessageHandle)
    IdP-->>Browser: 302 Redirect to SP ACS URL<br/>SAMLart=... + RelayState (HTTP-Artifact binding)
    Browser->>SP: GET /saml/acs?SAMLart=...&RelayState=...

    SP->>ARS: SOAP over mutual TLS:<br/>signed ArtifactResolve (artifact)
    ARS->>ARS: Look up artifact, verify caller is the SP<br/>the artifact was issued for

    alt Artifact valid and unused
        ARS->>ARS: Delete artifact (one-time use)
        ARS-->>SP: ArtifactResponse containing the<br/>original Response + signed Assertion
        SP->>SP: Validate Response: signature, Issuer,<br/>Audience, Conditions, InResponseTo
        alt Assertion valid
            SP->>SP: Create SP session
            SP-->>Browser: 302 Redirect to RelayState target
            Browser-->>User: Signed-in application page
        else Assertion invalid
            SP-->>Browser: Error page "Assertion rejected"
        end
    else Artifact expired (TTL exceeded)
        ARS-->>SP: ArtifactResponse with empty content<br/>(no message for this handle)
        SP-->>Browser: Error page "Login expired -<br/>please try again"
        Note over SP,Browser: SP restarts SSO with a<br/>fresh AuthnRequest
    else Artifact already dereferenced (replay)
        ARS->>ARS: Handle found consumed -<br/>possible stolen SAMLart URL
        ARS-->>SP: ArtifactResponse with empty content
        SP->>SP: Log security event - artifact replay
        SP-->>Browser: Error page "Login could not<br/>be completed"
    end
```

Notes

- The browser never carries the assertion — only the 44-byte artifact reference in
  `SAMLart`; the sensitive payload moves on the SP-to-ARS SOAP channel (steps 9–12).
- `ArtifactResolve` is signed and the transport is mutually authenticated TLS; the ARS
  additionally checks the artifact belongs to the calling SP.
- Both failure alternates return an *empty* `ArtifactResponse` rather than an error
  detail, by design — the caller learns nothing about a handle it should not have.
