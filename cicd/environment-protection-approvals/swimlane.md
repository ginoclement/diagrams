---
title: "Environment Protection and Approvals — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Environment Protection and Approvals — Swimlane Diagram

One lane per actor. Arrows crossing lanes show the handoffs from build, through the
protection gate and human approval, to the actual deploy.

```mermaid
flowchart TD
    subgraph Author
        A1["Trigger run<br/>(push / merge / dispatch)"]
        A2(["See run outcome"])
    end

    subgraph Pipeline
        P1["Build and test job"]
        P2["Deploy job targets<br/>environment production"]
        P3["Resume with released secrets"]
        P4["Deploy artifact to target"]
        P5(["Run cancelled / failed"])
    end

    subgraph Environment
        E1{"Ref allowed by<br/>deployment branch policy?"}
        E2["Pause run, create pending deployment<br/>(secrets withheld)"]
        E3{"Approver distinct<br/>from Author?"}
        E4["Wait timer cool-off<br/>(e.g. 30 min)"]
        E5["Release environment-scoped secrets"]
    end

    subgraph Reviewer
        R1{"Approve or reject?"}
    end

    subgraph Target["Deploy target"]
        T1(["Production updated"])
    end

    A1 --> P1 --> P2 --> E1
    E1 -->|"No - branch blocked"| P5
    E1 -->|Yes| E2 --> R1
    R1 -->|Reject| P5
    R1 -->|"No response - timeout"| P5
    R1 -->|Approve| E3
    E3 -->|"No - self approval"| P5
    E3 -->|Yes| E4 --> E5 --> P3 --> P4 --> T1 --> A2
    P5 --> A2
```

Notes

- The `E2 --> R1` handoff is the pause: the run holds in the Environment lane with
  secrets withheld until the Reviewer acts.
- Every path that does not reach `E5` leaves the environment-scoped secrets
  unreleased, so a blocked, rejected, timed-out, or self-approved run never gets them.
- The break-glass override (see [flowchart.md](flowchart.md)) is an audited path that
  re-enters at `E5` for incidents.
