# Mutual TLS — Sequence Diagram

Happy path: TLS 1.3-style handshake with client authentication, validation, and
identity mapping. Alternates: no certificate (optional vs required), revoked
certificate, expired certificate.

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Server
    participant OCSP as OCSP / CRL
    participant App as App (identity mapping)

    %% ----- happy path -----
    Client->>Server: ClientHello (supported ciphers, key share)
    Server-->>Client: ServerHello + EncryptedExtensions
    Server-->>Client: CertificateRequest (acceptable CAs, sig algs)
    Server-->>Client: Certificate (server) + CertificateVerify + Finished
    Client->>Client: Validate server certificate chain
    Client->>Client: Select client cert matching requested CAs
    Client->>Server: Certificate (client cert + chain)
    Client->>Server: CertificateVerify (signature over handshake transcript)
    Note over Client,Server: Signature proves possession of the private key -<br/>cannot be replayed on another connection
    Client->>Server: Finished
    Server->>Server: Verify CertificateVerify signature
    Server->>Server: Validate chain to trusted CA, notBefore/notAfter,<br/>EKU contains clientAuth, constraints
    Server->>OCSP: Check revocation status (OCSP request or CRL lookup)
    OCSP-->>Server: Status good
    Server->>App: Connection authenticated - pass SAN / subject DN
    App->>App: Map certificate identity to account (SAN or DN registry)
    App-->>Server: Identity resolved
    Server-->>Client: Handshake complete - application data flows

    %% ----- alternates -----
    alt No client certificate provided
        Client->>Server: Empty Certificate message
        alt Client auth OPTIONAL
            Server->>App: Connection is unauthenticated
            App-->>Client: Serve public content or 401 at app layer
        else Client auth REQUIRED
            Server-->>Client: TLS alert certificate_required - handshake aborted
        end
    end

    alt Certificate revoked
        Server->>OCSP: Check revocation status
        OCSP-->>Server: Status revoked
        Server-->>Client: TLS alert certificate_revoked (or 403 at app layer)
        Note over Server: Hard-fail vs soft-fail on responder outage<br/>must be an explicit policy decision
    end

    alt Certificate expired
        Server->>Server: notAfter is in the past
        Server-->>Client: TLS alert certificate_expired - handshake aborted
        Note over Client: Client must renew/rotate its certificate<br/>(automate with short-lived certs)
    end
```
