# PKI Hierarchy — Trust Tier Topology Diagram

The hierarchy top-down: the air-gapped root anchors trust, issuing CAs (with their RA and
HSM) sign leaf certs, end entities hold them, and revocation services plus relying-party
trust stores complete the ecosystem.

```mermaid
flowchart TD
    subgraph Offline["Offline / Air-Gapped Root Tier"]
        Root["Offline Root CA<br/>(self-signed trust anchor)"]
        RootHSM[("Root HSM<br/>non-exportable key")]
    end

    subgraph Issuing["Issuing Tier (online)"]
        Int1["Intermediate / Issuing CA"]
        RA["Registration Authority (RA)"]
        IntHSM[("Issuing HSM")]
    end

    subgraph EndEntities["End-Entity Tier"]
        User["User certificate"]
        Device["Device certificate"]
        Service["Service / TLS certificate"]
    end

    subgraph Revocation["Revocation Services"]
        CRL["CRL Distribution Point"]
        OCSP["OCSP Responder"]
    end

    subgraph Verifiers["Relying Parties"]
        RP["Relying Party"]
        TS[("Trust Store<br/>trusted roots")]
    end

    Root -->|"signs (rare ceremony)"| Int1
    Root --- RootHSM
    Int1 --- IntHSM
    RA -->|"vetted CSR"| Int1
    Int1 -->|issues| User
    Int1 -->|issues| Device
    Int1 -->|issues| Service
    Int1 -->|"publishes status"| CRL
    Int1 -->|"publishes status"| OCSP

    Service -->|present cert| RP
    RP -->|"build chain to root"| TS
    RP -->|"check revocation"| OCSP
    RP -->|"fallback"| CRL
```

Notes

- The **Root Tier** is air-gapped: the root signs intermediates at infrequent ceremonies
  and is otherwise offline, so its key — the anchor of all trust — has minimal exposure.
- **Issuing CAs** are online and do all volume signing through their HSM; they are the
  revocable, replaceable layer that absorbs operational risk.
- End entities never chain directly to the root's key at runtime — relying parties trust
  the **root cert** from their local **Trust Store** and build the chain up from the leaf.
- **Revocation services** are published by the issuing CA and consulted by relying parties;
  they are what catch a compromised-but-unexpired certificate.
