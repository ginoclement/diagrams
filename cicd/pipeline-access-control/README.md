---
title: "Pipeline Access Control (CI/CD RBAC)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pipeline Access Control (CI/CD RBAC)

**Status:** ✅ Current

> Part of [CI/CD security and delivery](../README.md).

## Purpose

Who is allowed to **view**, **run**, **approve**, and **modify** CI/CD pipelines — and
what identity a pipeline runs *as* once it starts. Two separate control planes are in play
and are easy to confuse:

- **Protected branches** (git-side): who can push, merge, or force-push to `main` / release
  branches. Covered in depth in [Branch protection and code review](../branch-protection-code-review/README.md).
- **Protected pipelines / jobs / environments** (CI-side): who can trigger a run, who can
  approve a manual deployment gate, and which secrets a run can reach.

The third leg is **least privilege for the pipeline identity itself** — the token or service
account the job executes with (`GITHUB_TOKEN` and its `permissions:` block, the GitLab
`CI_JOB_TOKEN`, a Jenkins credential, or a cloud service account). Editing pipeline code is
code execution *with that identity's privileges*, so the right to edit `.github/workflows/`
or `.gitlab-ci.yml` is as sensitive as the token those files run under.

## When it's used

- Setting up team roles on a repo, group, or CI project (Reader → Developer → Maintainer →
  Owner, or GitHub's Read → Triage → Write → Maintain → Admin).
- Deciding who may trigger deploys, re-run failed jobs, or approve a manual/production gate.
- Hardening fork pull requests so untrusted contributors cannot run privileged pipelines or
  reach secrets.
- Scoping the default job token down from broad write access to per-job least privilege.
- Auditing who can edit pipeline-as-code, since that edit is arbitrary code execution.

## Actors / components

| Actor / component | Role |
|---|---|
| Contributor | Human with some role on the repo or CI project; may be an outside/fork collaborator |
| Maintainer / Owner | Human who can change pipeline config, protection rules, and role assignments |
| Approver | Human authorized to release a manual job or environment gate |
| VCS / SCM | GitHub, GitLab, or the git host enforcing branch protection and role RBAC |
| CI/CD system | GitHub Actions, GitLab CI, Jenkins, or Argo/Flux executing the pipeline |
| Pipeline identity | The token / service account a job runs as (`GITHUB_TOKEN`, `CI_JOB_TOKEN`, Jenkins credential, SA) |
| Runner / executor | The machine or pod running the job; see [Ephemeral runner isolation](../ephemeral-runner-isolation/README.md) |

## Role tiers (illustrative)

| Tier | Typical rights |
|---|---|
| Reader | View pipeline config, logs, and run history |
| Developer / Write | Push to non-protected branches, trigger runs, re-run own jobs |
| Maintainer | Edit protection rules, CI/CD variables, environment scopes, manage approvals |
| Owner / Admin | Manage members and roles, delete the project, override protections |

Fork / outside contributors sit **below** Reader for privileged actions: their PR runs execute
with a **read-only token, no secrets**, and often require a maintainer's "approve and run".

## Alternate scenarios covered

- **Fork PR from an outside collaborator** — workflow runs with a reduced, read-only token,
  secrets withheld, and a maintainer must approve the run.
- **Admin override** — an Owner/Admin bypasses a protection to unblock a stuck release,
  producing an audit event.
- **Break-glass** — a time-boxed elevation grants deploy/approve rights during an incident,
  logged and auto-revoked.
- **UI-configured vs pipeline-as-code edit** — who may change behavior via the CI UI vs by
  committing a change to the pipeline definition.

## Security notes

- **Default-deny token scopes.** Start the job token at `permissions: read-all` (GitHub) or
  the narrowest `CI_JOB_TOKEN` allowlist and **elevate per-job** only where needed
  (e.g. `contents: write` on the publish job alone).
- **Avoid one over-privileged CI admin.** Separate the identity that *edits* pipelines from
  the identity that *deploys*, and use **separate identities per environment** (dev/staging/prod)
  so a compromised dev run cannot touch prod.
- **Untrusted fork PRs get no secrets and no write token.** Never expand fork permissions
  automatically; require explicit maintainer approval to run.
- **Audit who can edit `.github/workflows/` or `.gitlab-ci.yml`.** Editing pipeline code is
  code execution with the pipeline's privileges — treat CODEOWNERS on those paths as a control.
- **Approvals must be human and non-self.** Prevent the author of a change from approving
  their own production deployment.
- Pin third-party actions/orbs/shared libraries to a commit SHA so a supply-chain swap cannot
  silently inherit the pipeline's identity.

## Diagrams

- [sequence.md](sequence.md) — trigger → RBAC check → run-as identity, with fork PR, admin override, and break-glass alternates.
- [swimlane.md](swimlane.md) — lanes for Contributor, VCS/SCM, CI/CD system, Approver, and Pipeline identity.
- [flowchart.md](flowchart.md) — the gate logic: who can trigger, whether secrets/token are granted, and approval decisions.

## Related diagrams

- [CI/CD security and delivery](../README.md) — the category index.
- [Branch protection and code review](../branch-protection-code-review/README.md) — the git-side control plane.
- [Environment protection and approvals](../environment-protection-approvals/README.md) — deployment gates and reviewers.
- [Ephemeral runner isolation](../ephemeral-runner-isolation/README.md) — where the pipeline identity actually executes.
- [Secrets management in pipelines](../secrets-management-in-pipelines/README.md) — what the scoped token is allowed to read.
- [RBAC](../../authorization/rbac/README.md) — the general role-based access-control model behind these tiers.
