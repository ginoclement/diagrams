# Branch Protection and Code Review

**Status:** ✅ Current

> Part of [CI/CD security and delivery](../README.md).

## Purpose

The git-side controls that stop unreviewed, unverified, or breaking code from reaching a
protected branch (`main`, release branches). A protected branch (GitHub branch protection or
a **ruleset**, GitLab **protected branches**, a Gerrit access-controlled `refs/heads/*`)
rejects direct pushes and force-pushes, and requires a **pull/merge request** that satisfies a
set of gates before it can merge:

- **Required reviews** — N approvals from people other than the author.
- **Required status checks** — named CI jobs must report success (CI green) before merge.
- **CODEOWNERS-required reviewers** — the owners of any touched path must approve.
- **Required signed commits** — every commit is a verified GPG / SSH / gitsign signature.
- **Dismiss stale approvals on new push** — a new commit invalidates prior approvals.
- **Require linear history** and **require branch up to date** with the base before merge.
- **Restrict who can push/merge**, block force-push, and block branch deletion.

A **merge queue** (GitHub merge queue, GitLab **merge trains**) serializes merges: each PR is
re-tested against the current tip of `main` *just before* merging, so two independently-green
PRs that conflict semantically cannot both land and break the branch. The queue keeps `main`
releasable at all times.

## When it's used

- Any repository where `main` must stay green and every change is peer-reviewed.
- Enforcing owner review on sensitive paths (`.github/workflows/`, deploy config, IAM policy)
  through CODEOWNERS.
- Requiring signed commits so a merged commit's author cannot be spoofed.
- High-traffic repos where concurrent green PRs would otherwise land semantic conflicts —
  solved by a merge queue / merge train re-testing against latest `main`.

## Actors

| Actor / component | Role |
|---|---|
| Author | Contributor opening the pull/merge request |
| Reviewer | Human approving or requesting changes |
| Code owner | Reviewer required by CODEOWNERS for a touched path |
| VCS / SCM | GitHub, GitLab, or Gerrit enforcing branch protection, rulesets, and the queue |
| CI / checks | GitHub Actions, GitLab CI, or Jenkins reporting required status checks |
| Merge queue | The serializer re-testing each PR against latest base before merge |
| Admin | Owner who can override a protection (audited, discouraged) |

## Alternate scenarios covered

- **Requested changes** — a reviewer blocks; merge is held until the thread is resolved and
  re-approved.
- **Required status check fails** — a red check blocks merge even with approvals.
- **Missing CODEOWNER approval** — a touched path's owner has not approved; merge is blocked.
- **Unsigned commit** — a commit without a verified signature is rejected by the signed-commits
  rule.
- **Stale approval dismissed** — a new push after approval clears prior approvals and re-runs
  review.
- **Merge queue re-test fails** — the PR is ejected from the queue and `main` stays green.
- **Admin bypass** — an owner overrides a protection to unblock a release; the action is
  audited and discouraged.

## Security notes

- **Require review + green checks together.** Approvals without required status checks (or vice
  versa) leaves an obvious gap; enforce both on the protected branch.
- **CODEOWNERS on sensitive paths.** Make `.github/workflows/`, `.gitlab-ci.yml`, deploy and
  IAM config require owner approval — editing pipeline code is code execution with the
  pipeline's privileges.
- **Signed commits prevent author spoofing.** Require verified GPG / SSH / gitsign so a merged
  commit's authorship cannot be forged.
- **Block self-approval.** The author must not satisfy the required-review count; approvals must
  come from other people.
- **Dismiss stale approvals on new push** so a post-approval commit cannot smuggle in
  unreviewed changes.
- **A merge queue keeps `main` releasable** by re-testing against the latest base; two green PRs
  that conflict cannot both land.
- **Minimize admin bypass.** Keep overrides rare, audited, and time-bound rather than a standing
  convenience.

## Diagrams

- [sequence.md](sequence.md) — open PR → CODEOWNERS review → approvals → checks → signed commits → merge queue → merge, with block alternates.
- [swimlane.md](swimlane.md) — lanes for Author, Reviewer / code owner, VCS / SCM, CI / checks, and Merge queue.
- [flowchart.md](flowchart.md) — the merge-gate decision tree with explicit block/fail terminals.

## Related diagrams

- [Branch-based code promotion](../code-promotion-branch-based/README.md) — how reviewed changes flow between branches.
- [Pipeline access control](../pipeline-access-control/README.md) — who may edit pipelines and run/approve deploys.
- [Environment protection and approvals](../environment-protection-approvals/README.md) — the deploy-time gates after merge.
- [CI/CD security and delivery](../README.md) — the category index.
