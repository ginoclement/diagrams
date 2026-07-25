# GitOps Pull-Based Deploy — Sequence Diagram

Happy path first: a merge to the config repo is pulled by the in-cluster reconciler, diffed
against live state, and applied until the cluster converges. Then alternates: drift auto-heal,
a sync failure that degrades without partial rollout, a prod sync window / approval, rollback
by `git revert`, and a signed-commit gate.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Repo as Config repo
    participant Rec as Reconciler
    participant Cls as Cluster
    participant Upd as Image updater

    Dev->>Repo: Open PR changing desired state<br/>(manifests / Helm / Kustomize)
    Dev->>Repo: Review + merge to main
    Rec->>Repo: Poll / webhook - detect new commit
    Repo-->>Rec: Fetch commit (pull, in-cluster creds only)
    Rec->>Rec: Render manifests
    Rec->>Cls: Read live state
    Cls-->>Rec: Current resources
    Rec->>Rec: Diff desired vs live
    Rec->>Cls: Apply difference to converge
    Cls-->>Rec: Resources healthy
    Rec->>Repo: Report Synced + Healthy status

    alt Manual drift detected (self-heal)
        Note over Cls: Someone runs kubectl edit on a live resource
        Rec->>Cls: Read live state
        Cls-->>Rec: Diverged from Git
        Rec->>Cls: Revert to Git-declared state
        Cls-->>Rec: Drift corrected
    end

    alt Sync fails (invalid manifest or failed health check)
        Rec->>Cls: Apply
        Cls-->>Rec: Error / health check failing
        Rec->>Rec: Mark Degraded, no partial rollout
        Rec->>Repo: Report Degraded, keep last healthy state
    end

    alt Prod sync window / manual approval
        Rec->>Rec: New commit detected for prod
        Rec->>Dev: Await approval / sync window
        Dev-->>Rec: Approve sync
        Rec->>Cls: Apply to prod
    end

    alt Rollback by git revert
        Dev->>Repo: git revert bad commit, merge
        Rec->>Repo: Detect revert commit
        Rec->>Cls: Reconcile back to prior state
    end

    alt Signed-commit gate
        Rec->>Rec: Verify commit signature<br/>(and manifest provenance)
        Note over Rec,Cls: Unsigned / unverified commit is not applied
    end

    alt Image update via PR
        Upd->>Repo: New image published - open PR<br/>bumping image digest in config
        Note over Upd,Repo: Image change enters through Git, reviewed like any commit
    end
```

Notes

- The reconciler always **pulls**: it fetches Git and reaches the cluster API from *inside*
  the cluster, so no external system holds cluster credentials.
- Reconciliation is continuous — drift is corrected on the next loop even with no new commit.
- A failed sync degrades to the last healthy state; there is no half-applied rollout.
- Rollback is a Git operation (`git revert`), because Git is the single source of truth.
