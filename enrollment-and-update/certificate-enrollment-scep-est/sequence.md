# Certificate Enrollment (SCEP / EST) — Sequence Diagram

Happy path shown for **SCEP**: capability discovery, CA cert retrieval, then a
challenge-authorized `PKCSReq`. Alternates: the **EST `/simpleenroll`** equivalent,
invalid challenge, pending manual approval with polling, and auto-renewal before expiry.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client / Device
    participant RA
    participant CA

    %% ----- happy path: SCEP -----
    Client->>Client: Generate key pair, build PKCS#10 CSR
    Client->>CA: GET GetCACaps (discover SHA-256, POSTPKIOperation)
    CA-->>Client: Capabilities list
    Client->>CA: GET GetCACert
    CA-->>Client: CA + RA certificates
    Client->>Client: Wrap CSR + challenge password<br/>in signed, encrypted PKCS#7
    Client->>RA: POST PKCSReq (PKIOperation)
    RA->>RA: Decrypt, verify challenge password,<br/>authorize request
    RA->>CA: Forward approved request
    CA->>CA: Issue certificate
    CA-->>Client: CertRep SUCCESS (PKCS#7 with cert)
    Client->>Client: Verify issued key matches CSR, install cert

    %% ----- alternates -----
    alt EST /simpleenroll (TLS-based)
        Client->>CA: GET /.well-known/est/cacerts
        CA-->>Client: CA certs (PKCS#7)
        Client->>RA: POST /.well-known/est/simpleenroll (CSR over TLS)
        RA->>RA: Authenticate client (TLS client-auth or basic),<br/>authorize
        RA->>CA: Approved request
        CA-->>Client: 200 issued certificate (application/pkcs7-mime)
        Note over Client,CA: EST runs over authenticated TLS,<br/>no PKCS#7 challenge-password wrapping needed
    end

    alt Challenge / one-time password invalid
        Client->>RA: POST PKCSReq (bad or reused challenge)
        RA->>RA: Challenge rejected
        RA-->>Client: CertRep FAILURE (badRequest / badMessageCheck)
        Note over Client,RA: Client must obtain a fresh one-time password,<br/>attempts are rate-limited
    end

    alt Pending manual approval
        Client->>RA: POST PKCSReq
        RA-->>Client: CertRep PENDING
        loop Poll until decided
            Client->>CA: GET GetCertInitial (poll)
            CA-->>Client: Still PENDING
        end
        alt Operator approves
            CA-->>Client: CertRep SUCCESS (cert)
        else Operator denies
            CA-->>Client: CertRep FAILURE (rejected)
        end
    end

    opt Auto-renewal before expiry
        Client->>Client: notAfter approaching - re-key
        alt SCEP renewal
            Client->>RA: POST PKCSReq signed with current cert
        else EST renewal
            Client->>RA: POST /.well-known/est/simplereenroll (CSR over TLS)
        end
        CA-->>Client: New certificate issued, replace old
    end
```
