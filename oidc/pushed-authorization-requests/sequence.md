---
title: "Pushed Authorization Requests — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9126"
---

# Pushed Authorization Requests — Sequence Diagram

Happy path: push the request, get a `request_uri`, redirect with it, redeem the
code. Then expiry/reuse, the require-PAR rejection, and a JAR variant.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client
    participant Browser
    participant IdP as IdP (authorization server)

    User->>Client: Start sign-in
    Client->>Client: Build code_verifier + S256 challenge,<br/>state, nonce, scope, authorization_details
    Client->>IdP: POST /par (back channel, client auth)<br/>response_type=code, client_id, redirect_uri,<br/>scope, code_challenge, state, nonce
    IdP->>IdP: Validate all parameters, store request
    IdP-->>Client: 201 request_uri=urn:...:request_uri:abc<br/>expires_in=60
    Client->>Browser: 302 to /authorize?client_id and request_uri
    Browser->>IdP: GET /authorize?client_id and request_uri=urn:...
    IdP->>IdP: Resolve request_uri to stored request<br/>(ignore any other query params)
    IdP->>User: Login + consent
    User->>IdP: Authenticate, consent
    IdP-->>Browser: 302 redirect_uri?code and state
    Browser->>Client: Deliver code + state
    Client->>IdP: POST /token grant_type=authorization_code<br/>code, code_verifier, redirect_uri
    IdP-->>Client: 200 tokens

    alt request_uri expired or already used
        Browser->>IdP: GET /authorize?request_uri=urn:... (stale)
        IdP-->>Browser: error=invalid_request_uri
    end

    alt AS requires PAR - plain request rejected
        Browser->>IdP: GET /authorize?response_type=code&scope=... (no request_uri)
        IdP-->>Browser: error=invalid_request (PAR required)
    end

    opt Signed request object (JAR) pushed via PAR
        Client->>IdP: POST /par request=eyJ...signed JWT
        IdP->>IdP: Verify signature, then store
        IdP-->>Client: 201 request_uri + expires_in
    end
```
