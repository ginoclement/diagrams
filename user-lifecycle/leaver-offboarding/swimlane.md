---
title: "Leaver — Offboarding Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Leaver — Offboarding Swimlane Diagram

One lane per actor. The IGA lane sequences the ordered teardown; disable and revoke land in
the IdP lane, deprovision in the app lane, and reclaim/archive in the IT lane.

```mermaid
flowchart TD
    subgraph HR["HR / Source of Truth"]
        H1["Termination / end-date event"]
        H2{"For cause /<br/>immediate?"}
    end

    subgraph IGA["IGA Engine"]
        G1["Orchestrate ordered teardown"]
        G2["Deprovision downstream apps"]
        G3["Trigger reclaim + archive"]
        G4["Hold through retention window"]
        G5["Retention expired -> delete"]
        G6["Reconcile accounts vs HR<br/>(orphan detection)"]
    end

    subgraph IdP["IdP / Directory"]
        I1["Disable account (active=false)"]
        I2["Revoke sessions + OAuth tokens"]
        I3["Re-enable on rehire"]
        I4["Hard-delete account"]
    end

    subgraph App["Downstream App"]
        A1["SCIM DELETE /Users<br/>or active=false"]
        A2["Purge residual data"]
        A3([App access removed])
    end

    subgraph IT["IT"]
        T1["Reclaim licenses,<br/>wipe / collect devices"]
        T2["Archive mailbox + files,<br/>transfer ownership"]
        T3["Confirm flagged orphans"]
    end

    H1 --> H2
    H2 -->|standard notice| G1
    H2 -->|for cause| I1
    G1 --> I1 --> I2
    I2 --> G2 --> A1 --> A3
    G2 --> G3 --> T1 --> T2
    T2 --> G4 --> G5 --> I4
    G5 --> A2
    G6 -.-> T3
    T3 -.->|confirmed orphan| I1
    H1 -.->|rehire match| I3
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
