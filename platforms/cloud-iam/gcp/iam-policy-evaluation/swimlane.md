---
title: "IAM Allow-Policy Evaluation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IAM Allow-Policy Evaluation — Swimlane Diagram

One lane per actor. The Hierarchy lane shows the ancestry levels whose policies are unioned.

```mermaid
flowchart TD
    subgraph Client["Client (SDK / gcloud)"]
        C1["Call Google API with<br/>Bearer access token"]
        C2(["Receive 200 or 403"])
    end

    subgraph API["Google API"]
        A1["Authenticate token,<br/>resolve principal + permission"]
        A2["Ask IAM to authorize"]
        A3["Return result to caller"]
    end

    subgraph IAM["Cloud IAM engine"]
        M1["Evaluate deny policies first"]
        M2{"Deny rule<br/>matches?"}
        M3["Union allow bindings<br/>from all ancestors"]
        M4["Expand groups,<br/>evaluate CEL conditions"]
        M5{"Any applicable<br/>binding grants<br/>the permission?"}
        M6["Decision ALLOW"]
        M7["Decision DENY"]
    end

    subgraph Hier["Resource Hierarchy"]
        H1["Organization policy"]
        H2["Folder policies"]
        H3["Project policy"]
        H4["Resource policy"]
    end

    C1 --> A1 --> A2 --> M1
    H1 --> M1
    H2 --> M1
    H3 --> M1
    H4 --> M1
    M1 --> M2
    M2 -->|"Yes - not excepted"| M7
    M2 -->|No| M3
    H1 --> M3
    H2 --> M3
    H3 --> M3
    H4 --> M3
    M3 --> M4 --> M5
    M5 -->|Yes| M6
    M5 -->|No| M7
    M6 --> A3 --> C2
    M7 --> A3
```

Notes

- Both deny and allow evaluation read the full ancestry (org → folder → project → resource);
  the Hierarchy lane feeds `M1` and `M3`.
- Inheritance is additive: a grant at any level flows down, so `M3` unions rather than picks a
  single policy.
- Condition and deny failures both land on the same DENY terminal `M7`; the
  [flowchart.md](./flowchart.md) separates the reasons.
