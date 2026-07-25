---
title: "GitOps Pull-Based Deploy — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# GitOps Pull-Based Deploy — Decision Flowchart

The continuous reconciliation loop: detect the desired state in Git, verify it, diff against
live, apply, and check health. Drift correction, degraded, and rejection terminals are explicit.

```mermaid
flowchart TD
    S(["Reconcile tick<br/>(poll / webhook / interval)"]) --> New{"New commit<br/>on config repo?"}
    New -->|No| Drift{"Live state drifted<br/>from Git?"}
    New -->|Yes| Sig{"Commit signature<br/>+ provenance valid?"}

    Sig -->|No| Reject(["Do not apply:<br/>unsigned / unverified commit"])
    Sig -->|Yes| Window{"Protected env needs<br/>approval / sync window?"}

    Window -->|"Yes - not approved"| Wait(["Hold: await approval<br/>or sync window"])
    Window -->|"Yes - approved"| Render["Render manifests"]
    Window -->|No| Render

    Render --> Diff{"Desired differs<br/>from live?"}
    Diff -->|No| Converged(["Synced + Healthy:<br/>cluster matches Git"])
    Diff -->|Yes| Apply["Apply difference to cluster"]

    Drift -->|"No"| Converged
    Drift -->|"Yes - out-of-band edit"| Apply

    Apply --> Health{"All resources<br/>healthy?"}
    Health -->|No| Degraded(["Degraded: keep last healthy state,<br/>no partial rollout"])
    Health -->|Yes| Converged

    Converged --> Loop(["Wait for next tick<br/>(continuous reconciliation)"])
    Degraded --> Loop
```

Notes

- The loop runs continuously: even with no new commit, the `Drift` branch re-converges an
  out-of-band `kubectl` edit back to the Git-declared state (self-heal).
- A failed apply terminates at `Degraded` and preserves the last healthy state — there is never
  a half-applied rollout.
- Rollback is not a special path here: a `git revert` is simply a new commit that re-enters at `New`.
