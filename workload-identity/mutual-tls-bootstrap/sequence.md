---
title: "Mutual TLS Bootstrap — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Mutual TLS Bootstrap — Sequence Diagram

Happy path first: the workload attests, submits a CSR, receives a leaf certificate, then uses
it for mutual TLS. Alternates: bootstrap-token evidence, rotation, and failure paths.

```mermaid
sequenceDiagram
    autonumber
    participant WL as Workload
    participant Att as Attestor
    participant CA as CA / Issuer
    participant Peer as Peer service

    Note over WL: Fresh start - no certificate yet
    WL->>WL: Generate keypair,<br/>private key stays local

    alt Platform attestation (cloud IID / k8s / TPM)
        WL->>Att: Request node evidence
        Att-->>WL: Signed attestation document
    else One-time bootstrap token
        Note over WL,CA: Operator/provisioner injected a single-use join token
    end

    WL->>CA: Submit CSR (public key)<br/>+ attestation evidence
    CA->>CA: Verify evidence freshness + signature,<br/>identify attested principal
    CA->>CA: Authorize requested identity<br/>(SPIFFE ID / DNS SAN) for principal
    alt Evidence valid and identity authorized
        CA->>CA: Sign short-lived leaf cert
        CA-->>WL: Leaf certificate + trust bundle
        WL->>Peer: mTLS handshake<br/>(present leaf, validate peer cert)
        Peer-->>WL: Mutually authenticated channel
    else Evidence invalid / replayed
        CA-->>WL: Denied - no certificate
    else Identity not authorized for principal
        CA-->>WL: Denied - identity refused
    end

    opt Rotation before expiry
        WL->>WL: Generate new keypair
        WL->>CA: New CSR (re-attest if evidence expired)
        CA-->>WL: New short-lived leaf
        WL->>Peer: Continue mTLS with fresh cert, no downtime
    end
```

Notes

- The private key is generated on the workload and never sent; the CSR carries only the
  public key to be certified.
- Attestation answers "which principal is this", authorization answers "which identity may it
  hold" — both gates must pass before the CA signs.
- Rotation re-runs the same CSR path; if the attestation evidence has also expired the
  workload re-attests first, otherwise it simply re-keys.

Related: [README](./README.md) | [Swimlane](./swimlane.md) | [Flowchart](./flowchart.md)
