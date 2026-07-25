# Dynamic Client Registration — Sequence Diagram

Happy path (open registration) first, then the protected / software-statement
variant, lifecycle management (RFC 7592), and error cases.

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant IdP as IdP (auth server)
    participant Dir as Directory (SS issuer)

    Note over Client,IdP: AS advertises registration_endpoint in metadata
    Client->>IdP: POST /register (JSON client_metadata:<br/>redirect_uris, grant_types, token_endpoint_auth_method, ...)
    IdP->>IdP: Validate redirect_uris, grant_types, scope
    IdP-->>Client: 201 Created client_id (+ client_secret),<br/>registration_access_token, registration_client_uri
    Client->>Client: Store credentials, begin normal OAuth/OIDC flows

    alt Protected registration with software statement
        Client->>Dir: Obtain signed software_statement (JWT)
        Dir-->>Client: software_statement (asserts redirect_uris, software_id, ...)
        Client->>IdP: POST /register with software_statement<br/>+ Authorization: Bearer initial_access_token
        IdP->>IdP: Verify SS signature against trusted issuer keys,<br/>SS claims override JSON metadata
        IdP-->>Client: 201 Created client_id
    end

    opt Read / update config (RFC 7592)
        Client->>IdP: GET registration_client_uri<br/>Authorization: Bearer registration_access_token
        IdP-->>Client: 200 current client_metadata
        Client->>IdP: PUT registration_client_uri (full updated metadata)
        IdP-->>Client: 200 updated config (maybe new reg access token)
    end

    opt Deregister
        Client->>IdP: DELETE registration_client_uri (Bearer reg access token)
        IdP-->>Client: 204 No Content
    end

    alt Invalid metadata
        Client->>IdP: POST /register (bad redirect_uris)
        IdP-->>Client: 400 error=invalid_redirect_uri
    end

    alt Bad or expired registration access token
        Client->>IdP: PUT registration_client_uri (stale token)
        IdP-->>Client: 401 Unauthorized
    end
```
