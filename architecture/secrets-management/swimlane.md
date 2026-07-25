---
title: "Secrets Management — Zone Topology Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Management — Zone Topology Diagram

Consumers on the left authenticate into the store's control plane, which drives the secret
engines and leans on the master key/HSM and encrypted storage. Target systems (databases,
clouds) sit in their own tier where dynamic secrets are minted.

```mermaid
flowchart LR
    subgraph Consumers["Consumers"]
        App["Application / Workload"]
        CI["CI/CD Pipeline"]
    end

    subgraph Control["Secret Store — Control Plane (Trust Boundary)"]
        AuthM["Auth Methods<br/>(OIDC / K8s / IAM / mTLS)"]
        Policy["Policy Engine<br/>(identity to path mapping)"]
        Lease["Lease / Rotation Manager"]
        Audit[("Audit Log<br/>append-only")]
    end

    subgraph Engines["Secret Engines"]
        KV["Static KV"]
        DynDB["Dynamic DB Creds"]
        Cloud["Cloud Keys"]
        Transit["Encryption-as-a-Service"]
        PKIeng["PKI / Certificates"]
    end

    subgraph Core["Store Core (Sealed)"]
        Master[("Master Key / HSM<br/>seal / unseal")]
        Store[("Backing Datastore<br/>encrypted state")]
    end

    subgraph Targets["Target Systems"]
        DB[("Databases")]
        CSP[("Cloud Providers")]
    end

    App -->|authenticate| AuthM
    CI -->|authenticate| AuthM
    AuthM --> Policy
    App -->|"request secret (token)"| Policy
    CI -->|"request secret (token)"| Policy

    Policy --> KV
    Policy --> DynDB
    Policy --> Cloud
    Policy --> Transit
    Policy --> PKIeng

    DynDB -->|mint ephemeral creds| DB
    Cloud -->|mint short-lived keys| CSP
    DynDB --> Lease
    Cloud --> Lease
    PKIeng --> Lease

    AuthM -.-> Audit
    Policy -.-> Audit
    Lease -.-> Audit

    Master -.->|unseal / encrypt| Store
    KV --> Store
    Transit --> Master
    PKIeng --> Master
```

Notes

- Consumers reach only the **control plane**; they never touch the backing datastore, the
  master key, or the target systems directly.
- The **Policy Engine** is the single chokepoint between an authenticated identity and any
  secret engine — least privilege is enforced here.
- The **Store Core** is sealed: the master key (HSM-protected) gates decryption of the
  backing datastore, so stolen storage alone yields nothing. Transit and PKI engines use
  the master key without ever exposing it.
- Dynamic engines mint credentials directly in the **Target Systems** and register a lease,
  so every issued secret has a bounded lifetime and a clean revocation path.
