---
title: "Artifact Signing and Provenance — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Artifact Signing and Provenance — Swimlane Diagram

One lane per component. Build-time signing/attesting is on the left; verify-on-deploy handoffs
cross into the Admission lane, which gates the Cluster.

```mermaid
flowchart TD
    subgraph CI["CI Build"]
        C1["Build image, compute digest"]
        C2["Request signing cert via OIDC"]
        C3["cosign sign digest"]
        C4["Generate SLSA provenance<br/>(in-toto attestation)"]
        C5["Push image + signature + attestation"]
    end

    subgraph Sigstore["Fulcio + Rekor"]
        F1["Fulcio: verify OIDC identity,<br/>issue short-lived cert"]
        F2["Rekor: record signature + cert"]
    end

    subgraph Registry["Registry"]
        R1["Store image, signature,<br/>attestation"]
    end

    subgraph Admission["Admission gate"]
        A1["Fetch signature + attestation"]
        A2["Verify Rekor entry"]
        A3{"Signer identity<br/>on allow-list?"}
        A4{"Provenance meets<br/>policy + SLSA level?"}
        A5(["Deny admission"])
    end

    subgraph Cluster["Cluster"]
        K1(["Run admitted artifact"])
    end

    C1 --> C2 --> F1 --> C3 --> F2
    C3 --> C4 --> C5 --> R1
    F2 --> R1
    R1 -->|"deploy request"| A1 --> A2 --> A3
    A3 -->|"No"| A5
    A3 -->|"Yes"| A4
    A4 -->|"No"| A5
    A4 -->|"Yes"| K1
```

Notes

- The build lanes produce three things — image, signature, provenance — and the transparency
  log entry ties the signature to a logged identity.
- Both admission gates (`A3` identity, `A4` provenance) must pass; unsigned artifacts fail at
  `A1`/`A2` before reaching them.
- See [flowchart.md](flowchart.md) for the full admission decision tree and every deny reason.
