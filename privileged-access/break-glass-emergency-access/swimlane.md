---
title: "Break-Glass Emergency Access — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Break-Glass Emergency Access — Swimlane Diagram

One lane per actor. Alerting runs in parallel with the whole flow, not after it.

```mermaid
flowchart TD
    subgraph User
        U1["Declare emergency,<br/>invoke break-glass"]
        U2["Perform remediation"]
        U3["End emergency access"]
    end

    subgraph Custodian
        C1["Co-authorize<br/>(supply credential part)"]
    end

    subgraph PAM["PAM (vault)"]
        P1["Start invocation,<br/>require M-of-N control"]
        P2{"Quorum of custodians<br/>met?"}
        P3["Reassemble sealed credential,<br/>open recorded session"]
        P4["Rotate secret, re-split,<br/>re-seal, open review"]
    end

    subgraph SIEM
        M1["HIGH alert + page<br/>(non-suppressible)"]
        M2{"Matching incident<br/>on record?"}
        M3["Containment + escalate"]
    end

    subgraph Directory
        D1["Sign in as<br/>emergency account"]
        D2["Apply rotated secret"]
    end

    U1 --> P1 --> M1
    P1 --> M2
    M2 -->|"No"| M3
    M2 -->|"Yes"| P2
    P2 -->|"No"| U1
    P2 -->|"Yes"| C1 --> P3 --> D1 --> U2
    U3 --> P4 --> D2
```

Notes

- `M1` (alert / page) branches off the moment invocation starts, independent of whether
  access is ultimately granted — the loud signal is the point.
- `M2 -->|No| M3` is the abuse path: an invocation with no incident is treated as an
  attack and routed to containment instead of the seal.
- `P4`/`D2` are mandatory: no completed break-glass event ends without rotation, reseal,
  and a review ticket.
