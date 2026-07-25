---
title: "Access Review & Certification — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Access Review & Certification — Swimlane Diagram

One lane per actor. The IGA lane runs the campaign and remediation; the reviewer lane makes
per-item decisions; revocations cross into the IdP and app lanes.

```mermaid
flowchart TD
    subgraph IGA["IGA Engine"]
        G1["Generate campaign<br/>(scope + deadline)"]
        G2["Assign review items"]
        G3{"Deadline reached with<br/>undecided items?"}
        G4["Apply no-response policy:<br/>auto-revoke"]
        G5["Queue remediation<br/>for revoked items"]
        G6["Record signed decisions<br/>(audit evidence)"]
        G7([Campaign closed])
    end

    subgraph Reviewer["Reviewer (Manager / Owner)"]
        R1{"Access still<br/>needed?"}
        R2["Certify (keep)"]
        R3["Revoke"]
        R4["Bulk approve low-risk items"]
        R5["Delegate items to another reviewer"]
    end

    subgraph IdP["IdP / Directory"]
        I1["Remove revoked<br/>group memberships"]
    end

    subgraph App["Downstream App"]
        A1["Deprovision revoked<br/>entitlements (SCIM)"]
        A2([Access removed])
    end

    G1 --> G2 --> R1
    R1 -->|yes| R2 --> G6
    R1 -->|no| R3 --> G5
    R2 -.-> R4
    R1 -.-> R5
    R5 -.-> R1
    G2 --> G3
    G3 -->|yes| G4 --> G5
    G3 -->|no| G6
    G5 --> I1 --> A1 --> A2
    G6 --> G7
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
