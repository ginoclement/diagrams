---
title: "Branch-Based Code Promotion — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Branch-Based Code Promotion — Sequence Diagram

Happy path first: the trunk-based flow (short branch, PR, review, CI, merge to `main`,
tag a release). Then the GitFlow alternates — release-branch promotion and a hotfix —
and a blocked-promotion case when checks fail.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Rev as Reviewer
    participant CI
    participant Repo as Repository
    participant Rel as Release

    Note over Dev,Rel: Trunk-based (recommended) - short-lived branch, merge to main
    Dev->>Repo: Branch feature/x off main (short-lived)
    Dev->>Repo: Push commits, open PR to main
    Repo->>CI: Run required checks
    CI-->>Repo: Checks pass
    Rev->>Repo: Approve PR
    Repo->>Repo: Merge to main (protected)
    Dev->>Repo: Tag main commit (e.g. v1.4.0)
    Repo->>Rel: Cut release from tagged trunk commit
    Rel-->>Dev: Release built from immutable tag

    alt GitFlow release-branch promotion (legacy for many teams)
        Dev->>Repo: Merge feature/* into develop
        Dev->>Repo: Cut release/1.5 from develop
        Note over Dev,Repo: Only bug fixes on release/1.5 - no new features,<br/>stabilization only.
        CI-->>Repo: Release branch checks pass
        Repo->>Repo: Merge release/1.5 into main, tag v1.5.0
        Repo->>Repo: Merge release/1.5 back into develop
        Repo->>Rel: Build release from tagged main commit
    end

    alt GitFlow hotfix
        Dev->>Repo: Branch hotfix/1.4.1 from main
        Dev->>Repo: Commit fix, open PR
        CI-->>Repo: Checks pass
        Repo->>Repo: Merge hotfix into main, tag v1.4.1
        Repo->>Repo: Merge hotfix back into develop (keep in sync)
        Repo->>Rel: Ship patched release
    end

    alt Merge conflict or failing checks
        Dev->>Repo: Open PR
        Repo->>CI: Run required checks
        CI-->>Repo: Checks fail (or branch has conflicts)
        Repo-->>Dev: Promotion blocked - resolve conflicts / fix checks
    end
```

Notes

- Trunk-based keeps branches short so integration is continuous and merges stay small;
  the release is just a tag on `main`, and feature flags hide unfinished work behind it.
- GitFlow's `develop → release/* → main` chain adds long-lived branches whose divergence
  is the source of its heavyweight, slow-integration reputation.
- Both models promote through the same protected-branch and required-check gates; only
  the branch topology differs.
