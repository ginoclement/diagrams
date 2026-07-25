---
title: "Branch-Based Code Promotion — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Branch-Based Code Promotion — Swimlane Diagram

One lane per actor. The main path is the trunk-based flow; the GitFlow release and
hotfix branches join the Repository lane as alternate promotion routes.

```mermaid
flowchart TD
    subgraph Developer
        D1["Branch short-lived<br/>feature/x off main"]
        D2["Push commits, open PR"]
        D3["Tag main commit<br/>(e.g. v1.4.0)"]
        D4["GitFlow: cut release/1.5<br/>from develop"]
        D5["GitFlow: branch hotfix<br/>from main"]
    end

    subgraph Reviewer
        R1{"Approve PR?"}
    end

    subgraph CI
        C1{"Required checks<br/>pass?"}
    end

    subgraph Repository
        Q1["Merge to main (protected)"]
        Q2["Merge release/1.5 to main<br/>+ back to develop"]
        Q3["Merge hotfix to main<br/>+ back to develop"]
        Q4(["Promotion blocked:<br/>fix checks / conflicts"])
    end

    subgraph Release
        L1(["Release built from<br/>immutable tag"])
    end

    D1 --> D2 --> C1
    C1 -->|No| Q4
    C1 -->|Yes| R1
    R1 -->|No| Q4
    R1 -->|Yes| Q1 --> D3 --> L1

    D4 --> C1
    D4 -.->|"stabilize, then"| Q2 --> L1
    D5 --> C1
    D5 -.->|"fix, then"| Q3 --> L1
```

Notes

- Trunk-based is the solid path: `feature/x → PR → main → tag → release`, gated by CI
  and review.
- The dotted GitFlow routes fan more branches through the Repository lane
  (`release/1.5` and `hotfix`), both merging back to keep `develop` in sync — the
  bookkeeping that makes GitFlow heavier.
- Every route reaches `Release` only through a protected merge and a tag; failing
  checks or conflicts divert to the blocked terminal.
