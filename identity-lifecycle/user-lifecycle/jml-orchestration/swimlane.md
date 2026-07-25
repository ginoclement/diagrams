---
title: "JML Orchestration — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# JML Orchestration — Swimlane Diagram

One lane per actor across the whole lifecycle. The IGA lane is the hub that classifies each
HR event and routes it to the joiner, mover, or leaver handling, all landing in the shared
IdP and app lanes.

```mermaid
flowchart TD
    subgraph HR["HR / Source of Truth"]
        H1["Lifecycle event<br/>(new / change / termination)"]
    end

    subgraph IGA["IGA Engine"]
        G1{"Classify event"}
        G2["Joiner: compute birthright + RBAC<br/>(see joiner-onboarding)"]
        G3["Mover: diff + SoD<br/>(see mover-role-change)"]
        G4["Leaver: ordered teardown<br/>(see leaver-offboarding)"]
        G5["Reconciliation sweep:<br/>target vs actual"]
        G6["Certification campaign<br/>(see access-review-certification)"]
    end

    subgraph IdP["IdP / Directory"]
        I1["Create / enable account"]
        I2["Add / remove memberships"]
        I3["Disable + revoke sessions/tokens"]
    end

    subgraph App["Downstream App"]
        A1["Provision (SCIM)"]
        A2["Deprovision (SCIM)"]
        A3([Access state matches policy])
    end

    subgraph Reviewer["Reviewer (Manager / Owner)"]
        R1["Approve mover grants"]
        R2["Certify / revoke in reviews"]
    end

    H1 --> G1
    G1 -->|joiner| G2 --> I1 --> A1
    G1 -->|mover| G3 --> R1
    R1 --> I2 --> A1
    I2 --> A2
    G1 -->|leaver| G4 --> I3 --> A2
    G5 -.-> I2
    G5 -.-> A2
    G6 --> R2 --> A2
    A1 --> A3
    A2 --> A3
```

Related: [README](./README.md) | [Sequence](./sequence.md) | [Flowchart](./flowchart.md)
