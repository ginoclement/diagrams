---
title: "HR-Driven Inbound Provisioning — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HR-Driven Inbound Provisioning — Swimlane Diagram

One lane per actor. HR authoritatively supplies records; the Provisioning lane decides the
lifecycle action; the Directory and Downstream lanes carry it out.

```mermaid
flowchart TD
    subgraph HR["HR (source of record)"]
        H1["Worker records with effective dates"]
        H2["Expose delta since watermark"]
    end

    subgraph Prov["Provisioning engine"]
        P1["Read delta"]
        P2{"In scope?"}
        P3["Map + transform attributes"]
        P4{"Anchor matches<br/>existing account?"}
        P5{"Which lifecycle event?"}
        P6["Advance watermark, audit log"]
        PQ(["Quarantine record"])
    end

    subgraph Directory["Directory (target)"]
        D1["Create account"]
        D2["Update attributes"]
        D3["Disable / deprovision"]
    end

    subgraph Downstream["Downstream apps / groups"]
        W1["Start onboarding provisioning"]
        W2["Re-evaluate groups / entitlements"]
        W3["Revoke access"]
    end

    H1 --> H2 --> P1 --> P2
    P2 -->|"no"| P6
    P2 -->|"yes"| P3 --> P4
    P4 -->|"no match (new)"| P5
    P4 -->|"match"| P5
    P4 -->|"ambiguous / duplicate"| PQ
    P3 -->|"missing required attr"| PQ
    P5 -->|"Joiner"| D1 --> W1 --> P6
    P5 -->|"Mover"| D2 --> W2 --> P6
    P5 -->|"Leaver"| D3 --> W3 --> P6
```

Notes

- The `P2` scope gate and `P4` match gate together decide whether a record becomes a Joiner
  (no match), a Mover/Leaver (match), or nothing (out of scope).
- Every successful action loops back to `P6` to advance the watermark and write the audit
  entry, so the next run only sees new HR changes.
- Records that fail mapping or match ambiguously divert to the `PQ` quarantine terminal
  instead of writing to the Directory — see [flowchart.md](./flowchart.md).
