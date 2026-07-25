---
title: "Group Membership Sync — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Group Membership Sync — Swimlane Diagram

One lane per actor. The Directory lane is authoritative; the Sync lane flattens and diffs;
the App lane receives grants and revokes.

```mermaid
flowchart TD
    subgraph Directory["Directory (source)"]
        D1["Groups + memberships (may be nested)"]
        D2["Expose in-scope groups"]
    end

    subgraph Sync["Sync engine"]
        S1["Read groups"]
        S2["Flatten nested groups<br/>(cycle + depth guard)"]
        S3["Map to target entitlements"]
        S4["Read current app membership"]
        S5{"Per member:<br/>add, remove, or same?"}
        S6["Grant added members"]
        S7["Revoke removed members"]
        S8["Audit log"]
        SQ(["Defer / quarantine / report"])
    end

    subgraph App["Downstream app"]
        A1["Assign entitlement"]
        A2["Deprovision entitlement"]
        A3["Return current members"]
    end

    D1 --> D2 --> S1 --> S2 --> S3 --> S4
    A3 --> S4
    S4 --> S5
    S5 -->|"add"| S6 --> A1 --> S8
    S5 -->|"remove"| S7 --> A2 --> S8
    S5 -->|"unchanged"| S8
    S5 -->|"user not provisioned"| SQ
    S6 -.->|"target group missing"| SQ
    S2 -.->|"cycle detected"| SQ
```

Notes

- Flattening in the Sync lane (`S2`) resolves nested membership before the `S5` diff, so the
  App lane only ever sees a flat effective member list.
- The `remove` branch drives a real deprovision (`A2`), which is the control that prevents
  stale downstream access after someone leaves a source group.
- Deferrals, conflicts, missing target groups, and cycles all divert to the `SQ` terminal
  rather than corrupting the App state — see [flowchart.md](flowchart.md).
