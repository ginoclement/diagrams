---
title: "Access Review by Persona — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Access Review by Persona — Swimlane Diagram

A router lane resolves the persona; each persona then flows through its own cadence and
approver before decisions reach shared fulfillment.

```mermaid
flowchart TD
    subgraph Router["Persona resolution"]
        P0["Review campaign generated"]
        P1{"Principal type?"}
    end

    subgraph Reviewers["Reviewers"]
        S1["Standard: line manager<br/>(quarterly / annual)"]
        C1["Contractor: sponsoring manager<br/>(engagement-bound)"]
        V1["Privileged: resource owner<br/>+ security (monthly)"]
        K1["Workload: owning team<br/>(unused perms, stale keys)"]
    end

    subgraph Source["HR / Contract source"]
        H1{"Contract end date<br/>passed?"}
    end

    subgraph Decision["Campaign"]
        D1["Collect certify / revoke<br/>decisions + justification"]
    end

    subgraph Fulfillment["Fulfillment / SCIM"]
        F1(["Access retained where certified"])
        F2(["Access revoked where denied / lapsed"])
    end

    P0 --> P1
    P1 -->|standard| S1 --> D1
    P1 -->|contractor| H1
    H1 -->|No| C1 --> D1
    H1 -->|Yes| F2
    P1 -->|privileged| V1 --> D1
    P1 -->|workload| K1 --> D1
    D1 -->|certify| F1
    D1 -->|revoke| F2
```

Notes

- The Contractor lane can shortcut straight to revocation via the Source lane (`H1`) when the
  engagement has ended — no reviewer is consulted.
- The Privileged lane is the only one naming two reviewers; its default decision leans to
  revoke, which is why more of its edges reach `F2`.
- All personas converge on the same fulfillment lane, so the fork is entirely in *who reviews,
  how often, and the default* — not in how a revocation is executed.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Flowchart](./flowchart.md)
