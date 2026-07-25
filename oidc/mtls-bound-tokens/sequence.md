# mTLS Client Auth and Certificate-Bound Tokens — Sequence Diagram

Happy path (mTLS auth then bound-token use) first, then a replay on an unbound
connection, the self-signed variant, and introspection of a bound token.

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant IdP as IdP (auth server)
    participant API as API (resource server)

    Note over Client,IdP: Client registered with expected cert subject/SAN or jwks thumbprint
    Client->>IdP: TLS handshake to mtls token endpoint,<br/>presents X.509 client cert
    Client->>IdP: POST /token grant_type=client_credentials<br/>(no client_secret, cert is the credential)
    IdP->>IdP: Validate cert chain/thumbprint,<br/>match tls_client_auth registered DN/SAN
    IdP->>IdP: Compute x5t#S256 = base64url(SHA256(cert))
    IdP-->>Client: 200 access_token with<br/>cnf {"x5t#S256":"..."}
    Client->>API: TLS handshake presenting SAME client cert,<br/>then GET /resource Bearer AT
    API->>API: thumbprint(presented cert) == token cnf x5t#S256? yes
    API-->>Client: 200 data

    alt Token replayed without the bound cert
        Client->>API: GET /resource Bearer AT over TLS<br/>with no client cert or a different cert
        API->>API: thumbprint mismatch or no cert
        API-->>Client: 401 WWW-Authenticate: Bearer error=invalid_token
    end

    opt self_signed_tls_client_auth variant
        Client->>IdP: mTLS with self-signed cert,<br/>POST /token
        IdP->>IdP: Match SHA256(cert) against a key in<br/>registered jwks / jwks_uri (no CA needed)
        IdP-->>Client: 200 access_token with cnf x5t#S256
    end

    opt Opaque bound token, API uses introspection
        API->>IdP: POST /introspect token=AT<br/>(API authenticates with its own cert)
        IdP-->>API: 200 active:true, cnf x5t#S256
        API->>API: Compare presented cert thumbprint to cnf
    end
```
