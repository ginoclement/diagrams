---
title: "Mutual TLS Bootstrap — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Mutual TLS Bootstrap — Swimlane Diagram

One lane per actor. Attestation precedes the CSR; the CA gates issuance; the workload then
uses the leaf for mutual TLS.

```mermaid
flowchart TD
    subgraph Workload["Workload"]
        W1["Generate keypair<br/>(private key stays local)"]
        W2["Gather attestation evidence"]
        W3["Submit CSR + evidence"]
        W4["Receive leaf cert + trust bundle"]
        W5(["mTLS to peer with leaf cert"])
        W6["Rotate: new key + CSR<br/>before expiry"]
    end

    subgraph Attestor["Attestor"]
        T1["Issue signed evidence<br/>(IID, PSAT, TPM quote, join token)"]
    end

    subgraph CA["CA / Issuer"]
        C1["Verify evidence freshness<br/>+ signature"]
        C2{"Requested identity<br/>authorized for principal?"}
        C3["Sign short-lived leaf"]
        C4["Deny - refuse issuance"]
    end

    subgraph Peer["Peer service"]
        P1["Validate workload cert<br/>against trust bundle"]
        P2(["Mutually authenticated channel"])
    end

    W1 --> W2 --> T1 --> W3
    W3 --> C1 --> C2
    C2 -->|Yes| C3 --> W4 --> W5 --> P1 --> P2
    C2 -->|No| C4
    W6 -.-> C1
```

Notes

- The Attestor lane is consulted once at bootstrap (and again only if evidence expires during
  rotation); it never sees the private key.
- The `C2` gate separates attestation from authorization — a genuinely attested node is still
  refused an identity it is not entitled to.
- Rotation (`W6`) re-enters the CA lane at `C1`, keeping the certificate continuously fresh —
  see [flowchart.md](flowchart.md) for the full gate set.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
