---
title: "Branch Protection and Code Review — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Branch Protection and Code Review — Sequence Diagram

Happy path first (PR opens, CODEOWNERS reviewers requested, approvals granted, required checks
pass, signed commits verified, enters the merge queue, re-tested against latest `main`, merged),
then alternates: requested changes, a failing check, a missing CODEOWNER approval, an unsigned
commit, a stale-approval dismissal on new push, a merge-queue re-test failure, and an audited
admin bypass.

```mermaid
sequenceDiagram
    autonumber
    actor Author
    participant SCM as VCS / SCM
    actor Owner as Code owner
    participant CI as CI / checks
    participant MQ as Merge queue

    Author->>SCM: Open PR into protected main
    SCM->>SCM: Match touched paths to CODEOWNERS
    SCM->>Owner: Request required reviewers
    SCM->>CI: Trigger required status checks

    par Review and checks run together
        Owner->>SCM: Approve (non-author approvals)
        CI-->>SCM: All required checks report success
    end

    SCM->>SCM: Verify every commit signature<br/>(GPG / SSH / gitsign)
    SCM->>SCM: Branch up to date and linear history?

    alt All gates satisfied
        Author->>SCM: Click "Merge when ready"
        SCM->>MQ: Enqueue PR
        MQ->>MQ: Rebase onto latest main, re-run checks
        alt Re-test green against latest main
            MQ->>SCM: Fast-forward merge, main stays green
            SCM-->>Author: PR merged
        else Re-test fails (semantic conflict)
            MQ->>SCM: Eject PR from queue
            SCM-->>Author: Removed from queue - fix and re-enter
        end
    end

    alt Reviewer requests changes
        Owner->>SCM: Request changes
        SCM-->>Author: Merge blocked until resolved and re-approved
    else Required check fails
        CI-->>SCM: A required check reports failure
        SCM-->>Author: Merge blocked - fix the red check
    else Missing CODEOWNER approval
        SCM->>SCM: A touched path's owner has not approved
        SCM-->>Author: Merge blocked - CODEOWNER review required
    else Unsigned commit present
        SCM->>SCM: Commit lacks a verified signature
        SCM-->>Author: Merge blocked - sign and re-push
    end

    opt New push after approval
        Author->>SCM: Push a new commit
        SCM->>SCM: Dismiss stale approvals
        SCM->>Owner: Re-request review
        SCM->>CI: Re-run required checks
    end

    opt Admin bypass (discouraged)
        Author->>SCM: Owner/Admin overrides a protection
        SCM->>SCM: Record bypass in audit log
        SCM-->>Author: Merged via override (audited)
    end
```

Notes

- Review and required checks run in parallel; both must be satisfied before the PR is eligible
  for the merge queue.
- The merge queue's value is the re-test in the `MQ` block: a PR that was green in isolation is
  re-tested against the current tip of `main`, so a semantic conflict ejects it instead of
  breaking the branch.
- Dismissing stale approvals on a new push forces fresh review, closing the "approve then push
  unreviewed code" gap.
- Admin bypass always emits an audit event; it is the escape hatch, not the norm.
