---
title: "GitOps Pull-Based Deploy — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# GitOps Pull-Based Deploy — Swimlane Diagram

One lane per component. Note the arrow direction: the Reconciler lane reaches **out** to Git
and **into** the Cluster — nothing external reaches into the cluster, which is the whole point
of pull-based delivery.

```mermaid
flowchart TD
    subgraph Developer
        D1["Open PR changing<br/>desired state"]
        D2["Review + merge to main"]
        D3["Rollback = git revert<br/>bad commit"]
    end

    subgraph Repo["Config repo"]
        R1["New commit on main<br/>(single source of truth)"]
        R2["Verified, signed commit"]
    end

    subgraph Reconciler
        C1["Detect new commit,<br/>pull (in-cluster creds)"]
        C2{"Commit signature<br/>verified?"}
        C3["Render manifests,<br/>diff desired vs live"]
        C4{"Drift or<br/>difference?"}
        C5["Apply to converge"]
        C6{"Healthy?"}
    end

    subgraph Cluster
        K1["Live resources"]
        K2(["Synced + Healthy<br/>matches Git"])
        K3(["Degraded:<br/>last healthy state kept,<br/>no partial rollout"])
    end

    D1 --> D2 --> R1 --> C1 --> C2
    C2 -->|No| Reject(["Not applied:<br/>unsigned commit"])
    C2 -->|Yes - R2| C3
    K1 -.->|read live state| C3
    C3 --> C4
    C4 -->|"No - in sync"| K2
    C4 -->|"Yes - incl. manual drift"| C5 --> K1
    C5 --> C6
    C6 -->|Yes| K2
    C6 -->|No| K3
    D3 --> R1
```

Notes

- The `C4` gate fires on any divergence — a new commit *or* out-of-band `kubectl` drift — so
  self-heal and normal deploys share the same converge path.
- A failed apply lands in `K3` (Degraded), never a half-applied `K2`.
- Rollback (`D3`) is just another commit; it re-enters at `R1` and reconciles like any change.
- Every arrow into `Cluster` originates in the Reconciler lane — no external push.
