# Ephemeral Runner Isolation

**Status:** ✅ Current

> Part of [CI/CD security and delivery](../README.md).

## Purpose

Where a CI job actually executes, and how much of itself it leaves behind. Two models:

- **Persistent self-hosted runners** — a long-lived VM or host that runs job after job. It
  **retains state between jobs**: build caches, checked-out repos, installed tools, credentials
  in memory or on disk, and anything a previous job wrote. One compromised job can poison every
  later job on the same runner.
- **Ephemeral (single-use) runners** — a **fresh VM or container provisioned per job and
  destroyed after** (GitHub Actions ephemeral / just-in-time runners, Actions Runner Controller
  on Kubernetes, GitLab autoscaling runners with per-job isolation). No prior state, a
  least-privilege token, restricted network egress, and nothing to inherit.

The core risk is twofold. First, **state leak**: a persistent runner carries secrets, caches,
and any planted malware forward into unrelated jobs. Second, and worse, **running untrusted
fork-PR code on your own infrastructure**: an outside contributor's PR executes attacker-chosen
code on your runner, with whatever network reach and secrets that runner has — it can exfiltrate
credentials, pivot to internal resources, or persist on the host.

> **Risky / discouraged:** a **persistent self-hosted runner on a public repository that accepts
> fork pull requests, with no approval gate**. That combination hands arbitrary attacker code a
> long-lived host inside your network. Prefer ephemeral runners, and always require approval
> before a first-time contributor's workflow runs.

## When it's used

- Deciding between persistent self-hosted runners and ephemeral / just-in-time runners.
- Any public repo accepting fork PRs — where untrusted code must never touch a stateful,
  networked, secret-bearing host.
- Kubernetes-based CI via Actions Runner Controller or GitLab autoscaling, giving one clean pod
  per job.
- Hardening the approval gate so outside-contributor workflows do not run automatically.

## Actors

| Actor / component | Role |
|---|---|
| Job | The queued CI job/workflow needing an executor |
| CI control plane | GitHub Actions, GitLab CI, or Jenkins scheduling the job and enforcing approval gates |
| Maintainer | Human who approves a fork PR from an outside contributor before it runs |
| Provisioner | The autoscaler / controller that creates and destroys ephemeral runners (ARC, GitLab autoscaler) |
| Ephemeral runner | Single-use VM/container/pod: fresh, least-priv token, no prod network, destroyed after |
| Persistent runner | Long-lived self-hosted host that retains state between jobs (the risky contrast) |
| Internal resources | Networks, registries, and secret stores a runner might reach |

## Alternate scenarios covered

- **First-time contributor fork PR** — requires explicit maintainer approval before it runs at
  all; until then the workflow is held.
- **Persistent runner reused** — the state-leak path: caches, tools, and credentials from a
  prior job are visible to the next, shown as the discouraged pattern.
- **Compromised job attempts lateral movement** — contained by ephemerality (nothing persists)
  plus network egress restrictions (nowhere to pivot); the runner is destroyed regardless.
- **Self-hosted on a public repo with no approval gate** — the danger terminal: untrusted fork
  code runs on your infrastructure.

## Security notes

- **Prefer ephemeral, single-use runners.** One job = one clean environment, destroyed after,
  so no state — good or bad — carries forward.
- **Never run untrusted fork code on persistent self-hosted runners.** This is the single most
  important rule for public repos; that host has state, network, and often secrets.
- **Require approval for outside-contributor workflows.** A first-time contributor's PR should
  not execute until a maintainer approves the run.
- **Do not expose secrets to fork PRs.** Fork contexts get no environment secrets and a
  read-only token.
- **Restrict network egress** so a compromised job cannot reach internal resources or
  exfiltrate freely.
- **No long-lived secrets on runners.** Prefer short-lived, federated credentials — see
  [OIDC to cloud federation](../oidc-to-cloud-federation/README.md) — over static keys planted
  on a host.
- **Destroy after each job.** Ephemerality is the control; a runner that survives a job is a
  runner that can leak from it.

## Diagrams

- [sequence.md](sequence.md) — ephemeral happy path, fork-PR approval gate, persistent state-leak, and the discouraged public-repo danger branch.
- [swimlane.md](swimlane.md) — lanes for Job, CI control plane, Provisioner, Ephemeral runner, and the Persistent-runner contrast.
- [flowchart.md](flowchart.md) — trust / approval / isolation gates with an explicit danger terminal.

## Related diagrams

- [Pipeline access control](../pipeline-access-control/README.md) — who may trigger runs and what identity a job runs as.
- [Secrets management in pipelines](../secrets-management-in-pipelines/README.md) — keeping secrets off runners in the first place.
- [OIDC to cloud federation](../oidc-to-cloud-federation/README.md) — short-lived credentials instead of long-lived keys on a host.
- [CI/CD security and delivery](../README.md) — the category index.
