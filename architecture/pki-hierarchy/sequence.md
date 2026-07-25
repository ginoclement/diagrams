---
title: "PKI Hierarchy — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PKI Hierarchy — Sequence Diagram

Two linked runtime flows: (1) an end entity enrolls and the issuing CA signs a leaf
certificate after RA vetting and HSM signing; (2) a relying party later validates that
certificate's chain to the offline root and checks revocation. `alt`/`opt` cover RA
rejection, OCSP vs CRL, and a revoked certificate.

```mermaid
sequenceDiagram
    autonumber
    participant EE as End Entity
    participant RA as Registration Authority
    participant CA as Issuing CA
    participant HSM as HSM
    participant Root as Offline Root CA
    participant RP as Relying Party
    participant OCSP as OCSP Responder

    Note over Root,CA: Prior ceremony, the offline Root signed the Issuing CA cert,<br/>then went back air-gapped

    EE->>EE: Generate key pair, build CSR (public key + subject)
    EE->>RA: Submit CSR for enrollment
    RA->>RA: Vet request (identity, authorization, naming policy)
    alt Request approved
        RA->>CA: Forward approved CSR
        CA->>CA: Apply profile (validity, key usage, EKU, constraints)
        CA->>HSM: Sign certificate with issuing-CA private key
        HSM-->>CA: Signature (key never leaves the HSM)
        CA-->>EE: Issued leaf certificate + chain to root
        CA->>OCSP: Publish certificate status (good)
    else Request rejected
        RA-->>EE: Enrollment denied (policy / identity failure)
    end

    Note over EE,RP: Later, the End Entity presents its cert to a Relying Party

    EE->>RP: Present leaf certificate (e.g. TLS / mTLS handshake)
    RP->>RP: Build chain leaf to issuing CA to root
    RP->>RP: Verify each signature, validity dates,<br/>name / key-usage / basic constraints
    RP->>RP: Is the root in my trust store?

    opt Revocation check
        alt OCSP available
            RP->>OCSP: Query status of leaf (serial number)
            OCSP-->>RP: good / revoked / unknown
        else Fall back to CRL
            RP->>RP: Download CRL, check serial not listed
        end
    end

    alt Chain valid and not revoked
        RP-->>EE: Accept certificate, proceed
    else Chain invalid or revoked
        RP-->>EE: Reject connection
    end
```

Notes

- The offline root only appears in the setup note, at runtime it is air-gapped and never
  contacted, relying parties trust its cert from their local trust store.
- The RA is the policy gate before any signing, the CA applies a certificate profile that
  bounds validity, key usage, and constraints.
- Signing happens inside the HSM, steps 9-10, the issuing CA private key is non-exportable.
- Path validation and revocation are separate checks, a certificate can pass all the
  structural and date checks yet still be revoked, which is why the OCSP or CRL gate matters.
