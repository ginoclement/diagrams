# Deployment Environment Protection and Approvals

**Status:** ✅ Current

## Purpose

Gate a deployment to a sensitive target (typically `production`) behind
**protection rules** so a pipeline cannot ship on its own. A deploy job that
targets a protected environment pauses before it runs: it waits for a
**required reviewer** to approve, optionally sits out a **wait timer** cool-off,
and only proceeds if the triggering ref satisfies the environment's
**deployment branch policy**. Environment-scoped secrets are released to the job
only *after* the gate clears, and the approver must be a different person from
whoever triggered the run (separation of duties). The same shape appears across
GitHub Actions deployment environments, GitLab protected environments with
deployment approvals, and a Jenkins `input` step.

## When it's used

- Promoting a built artifact into `production` (or `staging`, `prod-eu`, any
  environment marked sensitive) where a human must sign off before release.
- Regulated or high-blast-radius deployments needing an auditable approval and a
  separation-of-duties control between author and approver.
- Releasing environment-scoped secrets (deploy keys, cloud credentials) that must
  never be exposed to an unapproved or fork-triggered run.

## Actors

| Actor | Role |
|---|---|
| Author | Person who triggers the deploy run (push, merge, or manual dispatch) |
| Pipeline | CI/CD runner executing build then deploy jobs |
| Environment | Protected deployment target holding the rules and scoped secrets |
| Reviewer | Required approver, distinct from the Author, who allows or rejects |
| Deploy target | The infrastructure the approved job deploys to |

## Vendor mapping

| Concept | GitHub Actions | GitLab | Jenkins |
|---|---|---|---|
| Approval gate | Required reviewers on an environment | Deployment approvals on a protected environment | `input` step in the stage |
| Cool-off delay | Wait timer (up to 30 days) | Manual scheduling / delayed job | `sleep` or timed `input` timeout |
| Allowed refs | Deployment branch policy | Protected environment allowed-to-deploy rules | Branch condition in the pipeline |
| Scoped secrets | Environment secrets | Protected/environment-scoped variables | Credentials bound in the stage |

## Alternate scenarios covered

- Existing approval reused — build succeeds and the required reviewer approves promptly.
- Reviewer rejects the deployment — the run is cancelled, no secrets released.
- Timeout with no approval — the pending deployment expires and the job is cancelled.
- Ref not permitted — the triggering branch/tag is outside the deployment branch policy and is blocked before any approval.
- Self-approval attempt — the Author tries to approve their own run and is blocked by separation of duties.
- Break-glass / emergency approval — an audited override path for incidents.

## Security notes

- Require reviewers to be **distinct from the Author**; enforce separation of duties
  so no single person can both trigger and approve a production deploy.
- Release **environment-scoped secrets only after** the approval gate clears, never
  to the build phase or to unapproved / fork-triggered runs.
- Restrict which branches and tags may deploy (deployment branch policy / protected
  environment rules) so only release refs can reach `production`.
- Treat the **wait timer as a cool-off window** to catch a bad deploy or a compromised
  approval before it lands, and to give time to cancel.
- **Audit every approval, rejection, and break-glass override** — who approved, when,
  and against which commit — and alert on emergency overrides.
- Scope the reviewer set narrowly; a large approver pool weakens the control.

## Diagrams

- [sequence.md](sequence.md) — build, pause, approval, wait timer, and release, with rejection/timeout/blocked alternates.
- [swimlane.md](swimlane.md) — lanes for Author, Pipeline, Environment, Reviewer, Deploy target.
- [flowchart.md](flowchart.md) — the gate decisions with explicit deny and cancel terminals.

## Related diagrams

- [Pipeline access control](../pipeline-access-control/README.md) — who may run and manage pipelines in the first place.
- [Environment-based code promotion](../code-promotion-environment-based/README.md) — promoting one artifact across environments, each gate an instance of this pattern.
- [Branch protection and code review](../branch-protection-code-review/README.md) — the review gate before code ever reaches a deploy.
- [Secrets management in pipelines](../secrets-management-in-pipelines/README.md) — how the environment-scoped secrets released here are stored and injected.
- [CI/CD security and delivery](../README.md) — category index.
