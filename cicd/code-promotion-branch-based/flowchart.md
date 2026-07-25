---
title: "Branch-Based Code Promotion — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Branch-Based Code Promotion — Decision Flowchart

Choosing a model, then the gates each promotion must clear. Blocked promotions
terminate explicitly; a release only exists once a protected commit is tagged.

```mermaid
flowchart TD
    S(["Start a change"]) --> Model{"Branching model?"}

    Model -->|"Trunk-based (recommended)"| T1["Branch short-lived<br/>feature off main"]
    Model -->|"GitFlow (legacy for many teams)"| G1["Branch feature off develop"]

    T1 --> Gate
    G1 --> GF{"Feature, release,<br/>or hotfix?"}
    GF -->|Feature| G2["Merge feature into develop"] --> G3["Cut release/* from develop"]
    GF -->|Hotfix| H1["Branch hotfix/* from main"]
    G3 --> Stab{"Only bug fixes<br/>on release branch?"}
    Stab -->|"No - new feature snuck in"| BlockStab(["Blocked: no features on release/*"])
    Stab -->|Yes| Gate
    H1 --> Gate

    Gate{"Required checks pass<br/>and no conflicts?"} -->|No| BlockCI(["Blocked: fix checks / resolve conflicts"])
    Gate -->|Yes| Review{"PR approved by reviewer?"}
    Review -->|No| BlockRev(["Blocked: awaiting approval"])
    Review -->|Yes| Protect{"Target branch protected<br/>and merge allowed?"}
    Protect -->|No| BlockProt(["Blocked: direct push / protection rule"])
    Protect -->|Yes| Merge["Merge to main<br/>(GitFlow: also back-merge to develop)"]

    Merge --> Tag{"Tag the release commit?"}
    Tag -->|No| Flagged["Merged behind feature flag,<br/>not yet released"]
    Tag -->|Yes| Rel(["Release cut from immutable tag"])
    Flagged -.->|"later: flip flag / tag"| Tag
```

Notes

- Model choice only changes the branch topology on the left; both funnel into the same
  checks → review → protected-merge → tag gates.
- The `Flagged` node captures trunk-based's key property: code can merge to `main`
  behind a feature flag without being released, so deploy and release stay decoupled.
- Every terminal that is not `Rel` is a blocked promotion; nothing reaches a release
  without a protected merge and a tag.
