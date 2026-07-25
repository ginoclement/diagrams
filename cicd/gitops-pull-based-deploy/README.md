# GitOps Pull-Based Deployment (In-Cluster Reconciler)

**Status:** 🔵 Emerging

## Purpose

GitOps inverts the deployment direction. The desired state of the system is declared
**in Git** (Kubernetes manifests, Helm charts, or Kustomize overlays), and an
**in-cluster reconciler** — Argo CD or Flux — **pulls** those manifests, compares them to
live cluster state, and applies the difference until the cluster **converges**. Unlike
push-based CI deploys, where an external CI system holds cluster credentials and pushes
changes in, no outside system needs cluster access: the agent runs *inside* the cluster and
reaches out to Git. Reconciliation is continuous, so **drift** (someone `kubectl edit`-ing a
live resource) is detected and reverted automatically (self-heal), and Git remains the single
source of truth and audit log.

## When it's used

- Kubernetes platforms standardizing on Argo CD or Flux for declarative, auditable delivery.
- Teams that want to remove cluster credentials from CI and shrink the deploy attack surface.
- Multi-cluster / multi-environment fleets where "the repo *is* the state" simplifies rollback
  (a `git revert`) and disaster recovery (re-point a fresh cluster at the same repo).

## Actors / components

| Actor / component | Role |
|---|---|
| Developer | Opens a PR to change desired state; merges after review |
| Config repo | Git repository holding declarative manifests — the single source of truth |
| Reconciler | In-cluster agent (Argo CD / Flux) that pulls the repo and reconciles state |
| Cluster | Kubernetes API server / live resources the reconciler converges toward desired state |
| Image updater | Optional automation that opens a PR to the config repo when a new image is published |

## Push vs pull

- **Push (CI holds creds):** CI runs `kubectl apply` / `helm upgrade` against the cluster;
  cluster credentials live in the CI system — a larger attack surface. See
  [Environment-based code promotion](../code-promotion-environment-based/README.md) for the
  push-style deployer.
- **Pull (GitOps):** the reconciler inside the cluster pulls Git; **no external system needs
  cluster credentials**, and the reconciler continuously enforces the declared state.

## Alternate scenarios covered

- Manual drift — someone edits a live resource; the reconciler detects divergence and reverts
  it to the Git-declared state (self-heal).
- Sync failure — an invalid manifest or failed health check leaves the app **degraded** with no
  partial rollout; the last healthy state stays live.
- Sync window / manual approval before applying to a protected (prod) environment.
- Rollback via `git revert` — because Git is the source of truth, undoing a commit reconciles
  the cluster back.
- Signed-commit / verified-manifest gate before apply — cross-links
  [Artifact signing and provenance](../artifact-signing-provenance/README.md).

## Security notes

- **Cluster credentials stay in-cluster.** The reconciler pulls; nothing external holds cluster
  creds, a smaller attack surface than push-based deploys.
- **Git is the source of truth and the audit log** — every change is a reviewed, attributable commit.
- **Protect the config repo like production** — branch protection and required review, since a
  merge *is* a deploy. See [Branch protection and code review](../branch-protection-code-review/README.md).
- **Verify commit signatures** (and optionally manifest provenance) before the reconciler applies.
- **Drift auto-heal** means out-of-band `kubectl` edits do not persist — every change must go through Git.
- **Separate the application repo from the config/deploy repo**, so app CI cannot directly mutate
  cluster state — it can only propose a change via PR.

## Diagrams

- [sequence.md](sequence.md) — merge, pull, diff, apply, converge; plus drift, sync-failure, approval, and rollback alternates.
- [swimlane.md](swimlane.md) — lanes for Developer, Config repo, Reconciler, and Cluster.
- [flowchart.md](flowchart.md) — reconciliation loop with drift, health, signature, and degraded terminals.

## Related diagrams

- [Environment-based code promotion](../code-promotion-environment-based/README.md) — build-once promotion, and the push-style contrast to this pull model.
- [Artifact signing and provenance](../artifact-signing-provenance/README.md) — the signature/provenance verified before apply.
- [Branch protection and code review](../branch-protection-code-review/README.md) — protecting the config repo, since merge equals deploy.
- [CI/CD security and delivery](../README.md) — category index.
