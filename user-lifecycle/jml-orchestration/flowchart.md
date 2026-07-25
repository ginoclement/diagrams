---
title: "JML Orchestration — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# JML Orchestration — Decision Flowchart

Event-routing logic: how the IGA engine classifies an HR event and dispatches it to the
correct transition, plus the reconciliation backstop. Each terminal points to the detailed
diagram for that path.

```mermaid
flowchart TD
    S([HR lifecycle event]) --> A{"Event type?"}

    A -->|new worker| B{"Matches a retained<br/>disabled identity?"}
    B -->|yes| C([Rehire -> re-enable account<br/>see leaver-offboarding])
    B -->|no| D([Joiner -> create + birthright<br/>see joiner-onboarding])

    A -->|attribute change| E{"Pending leaver for<br/>this worker?"}
    E -->|yes| F([Leaver wins - full teardown<br/>see leaver-offboarding])
    E -->|no| G([Mover -> re-evaluate + SoD<br/>see mover-role-change])

    A -->|termination| H([Leaver -> disable, revoke,<br/>deprovision, retain, delete])

    S2([Scheduled tick]) --> I{"Tick type?"}
    I -->|review cadence| J([Access certification campaign<br/>see access-review-certification])
    I -->|reconciliation| K{"Actual state = target state?"}
    K -->|yes| L([No drift - no action])
    K -->|no| M([Remediate drift + orphans<br/>via SCIM])
```

Notes

- Ordering conflicts resolve toward the most access-restrictive outcome: a pending leaver
  overrides an in-flight mover so a departing worker never lands in an over-provisioned
  state.
- Two clocks drive the system: HR events (real-time) and scheduled ticks (reviews and
  reconciliation) — the latter converges any state the former missed.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
