# Branch Protection and Code Review — Decision Flowchart

Every gate between "PR opened" and "merged to a protected branch": required reviews,
CODEOWNERS approval for touched paths, required status checks, signed commits, up-to-date /
linear history, and the merge-queue re-test. Each unmet gate has an explicit block terminal.

```mermaid
flowchart TD
    Start(["PR opened into protected branch"]) --> Direct{"Direct push or<br/>force-push attempted?"}
    Direct -->|Yes| DenyPush(["Reject: push/force-push blocked,<br/>use a PR"])
    Direct -->|No| Owners{"Touched paths have<br/>required CODEOWNERS?"}

    Owners -->|Yes| CoAppr{"All required code<br/>owners approved?"}
    CoAppr -->|No| BlockCo(["Blocked: CODEOWNER<br/>review required"])
    CoAppr -->|Yes| Reviews
    Owners -->|No| Reviews{"N required approvals<br/>from non-authors?"}

    Reviews -->|No| BlockRev(["Blocked: insufficient<br/>approvals"])
    Reviews -->|"Changes requested"| BlockReq(["Blocked: resolve requested<br/>changes, re-approve"])
    Reviews -->|Yes| Checks{"All required status<br/>checks green?"}

    Checks -->|No| BlockChk(["Blocked: required<br/>check failing"])
    Checks -->|Yes| Signed{"Every commit signature<br/>verified?<br/>(GPG / SSH / gitsign)"}
    Signed -->|No| BlockSig(["Blocked: unsigned or<br/>unverified commit"])
    Signed -->|Yes| Fresh{"Branch up to date and<br/>linear history?"}
    Fresh -->|No| Update["Rebase / update branch"] --> Checks
    Fresh -->|Yes| Stale{"New push dismissed<br/>prior approvals?"}
    Stale -->|Yes| BlockStale(["Blocked: stale approvals<br/>dismissed, re-review"])
    Stale -->|No| Queue["Enter merge queue"]

    Queue --> Retest{"Re-test green against<br/>latest main?"}
    Retest -->|No| Eject(["Ejected from queue,<br/>main stays green"])
    Retest -->|Yes| Merge(["Merged to protected branch"])

    %% Admin override is a discouraged, audited side path
    Start -.->|"override"| Admin{"Admin bypass<br/>invoked?"}
    Admin -->|Yes| AdminLog["Record audit event"] --> Merge
```

Notes

- The first gate rejects direct pushes and force-pushes outright: everything reaches a protected
  branch through a PR.
- CODEOWNERS approval is evaluated per touched path; a sensitive path (`.github/workflows/`,
  deploy config) with no owner approval blocks the merge even when the numeric review count is met.
- The `Fresh` loop sends an updated branch back through required checks, since re-basing can
  change what CI sees.
- The merge queue's `Retest` gate is the last line: a PR green in isolation is re-tested against
  the current tip and ejected on a semantic conflict rather than breaking `main`.
- Admin bypass is drawn as a dotted, audited side path — the discouraged escape hatch, not a
  normal route to merge.
