---
title: "Ephemeral Runner Isolation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Ephemeral Runner Isolation — Swimlane Diagram

One lane per component. Cross-lane arrows are the schedule, the provision, and the destroy.
The persistent-runner lane is the discouraged contrast, and the public-repo danger path is drawn
as a dashed branch to an explicit danger terminal.

```mermaid
flowchart TD
    subgraph Job["Job"]
        J1["Job queued"]
        J2(["Completed on clean,<br/>disposed environment"])
    end

    subgraph CI["CI control plane"]
        C1{"Trusted context?<br/>(internal branch or member,<br/>not a fork)"}
        C2{"Maintainer approved<br/>this fork run?"}
        C3["Withhold secrets,<br/>read-only token"]
        C4["Dispatch to ephemeral runner"]
    end

    subgraph Prov["Provisioner"]
        P1["Provision fresh VM / container / pod"]
        P2["Destroy runner after job"]
    end

    subgraph Run["Ephemeral runner"]
        R1["No prior state,<br/>least-priv token,<br/>egress restricted"]
        R2["Build / test in isolation"]
        R3["Upload artifacts + logs"]
    end

    subgraph Pers["Persistent runner (discouraged)"]
        E1["Reuse long-lived host"]
        E2["Inherit caches, tools,<br/>credentials from prior job"]
        E3(["State-leak risk:<br/>one bad job poisons the next"])
        E4(["DANGER: untrusted fork code<br/>on stateful networked host"])
    end

    J1 --> C1
    C1 -->|"Yes - trusted"| C4 --> P1 --> R1 --> R2 --> R3 --> P2 --> J2
    C1 -->|"No - fork PR"| C2
    C2 -->|Yes| C3 --> C4
    C2 -->|No| Held(["Held - never executes"])

    C1 -.->|"public repo, self-hosted,<br/>no approval gate"| E4
    J1 -.->|"persistent runner path"| E1 --> E2 --> E3
```

Notes

- The `C1` trust gate splits internal (trusted) jobs, which flow straight to a fresh runner,
  from fork PRs, which must pass the `C2` maintainer-approval gate and run secret-free.
- The ephemeral lane's `P1 --> ... --> P2` cycle is the whole point: provision fresh, run
  isolated, destroy after — no state survives.
- The persistent lane is the discouraged contrast: `E2 --> E3` is the state-leak risk, and the
  dashed `C1 -.-> E4` path is the danger of running untrusted fork code on a stateful,
  networked, self-hosted host.
- See [flowchart.md](flowchart.md) for the full gate logic and the explicit danger terminal.
