# Environment-Based Code Promotion (Build Once, Promote the Same Artifact)

**Status:** ✅ Current

## Purpose

The build-once, promote-everywhere delivery model. A single immutable artifact — a
container image addressed **by digest** (`sha256:...`), or a versioned package — is built
**exactly once**, published to a registry, and then the **same digest** is promoted through
`dev → staging → prod`. You never rebuild per environment: a rebuild produces a *different*
artifact than the one that passed testing, silently invalidating every gate it already
cleared. Only configuration and secrets differ per environment; the binary is byte-for-byte
identical everywhere. Each hop between environments is **gated** (automated tests, then a
human approval before prod), and promotion is a metadata operation — retag or copy the same
digest — never a `docker build`.

## When it's used

- Any pipeline where "what we tested in staging" must provably equal "what we shipped to prod".
- Container platforms addressing images by digest (Kubernetes, GitLab environments, Argo CD /
  Flux with an image updater), and versioned package flows (Maven/npm/OCI artifacts) where the
  version+hash is frozen at build time.
- Regulated or high-assurance delivery where provenance and reproducibility are audited — pairs
  with [Artifact signing and provenance](../artifact-signing-provenance/README.md).

## Actors / components

| Actor / component | Role |
|---|---|
| CI | Builds the artifact once, computes the immutable digest, pushes to the registry |
| Registry | OCI registry / artifact store holding the artifact addressed by digest |
| Deployer | Promotion engine that retags/copies the digest and deploys per environment |
| Dev | Development environment; first deploy target, fast automated checks |
| Staging | Pre-production environment; integration tests plus the promotion approval gate |
| Prod | Production environment; receives only the exact digest that cleared staging |
| Approver | Human who authorizes the staging-to-prod promotion |

## Key principle

- **Immutability by digest, not by floating tag.** `app:latest` can point anywhere; deploy the
  pinned `app@sha256:...` so the running artifact is provably the tested one.
- **Promotion = retag or cross-registry copy of the same digest.** The build job runs once; every
  later environment reuses that digest.
- **Config and secrets are environment-scoped**, injected at deploy time; the binary is unchanged.
- **Verify provenance/signature before each promotion**, so a tampered artifact cannot advance.

## Alternate scenarios covered

- Staging gate fails — promotion halts, prod is left untouched on its prior digest.
- Rollback — redeploy the previously-promoted known-good digest, no rebuild.
- Hotfix — the one case a new build is created, but it re-enters the *same* promotion path from
  dev rather than being pushed straight to prod.
- Provenance/signature verification failing before a promotion — the digest is refused entry.

## Security notes

- Pin and deploy by digest, never a mutable tag, so the running artifact cannot be swapped.
- Verify the signature and provenance attestation of the digest **before every promotion**, not
  just at build time — see [Artifact signing and provenance](../artifact-signing-provenance/README.md).
- Keep configuration and secrets environment-scoped; a promotion must not carry dev secrets into prod.
- **Never rebuild between staging and prod** — a rebuild is a new, untested artifact.
- Rollback is a redeploy of a prior known-good digest, not a revert-and-rebuild.
- Guard the promotion path with approvals — see
  [Environment protection and approvals](../environment-protection-approvals/README.md).

## Diagrams

- [sequence.md](sequence.md) — build once, then promote the same digest through each gated environment.
- [swimlane.md](swimlane.md) — lanes for CI, Registry, Deployer, and the dev/staging/prod environments.
- [flowchart.md](flowchart.md) — gate and verification decisions with explicit halt and rollback terminals.

## Related diagrams

- [Branch-based code promotion](../code-promotion-branch-based/README.md) — promotion driven by branches/merges instead of environments.
- [Artifact signing and provenance](../artifact-signing-provenance/README.md) — the signature/provenance checked before each promotion.
- [Environment protection and approvals](../environment-protection-approvals/README.md) — the human gate guarding the prod promotion.
- [GitOps pull-based deploy](../gitops-pull-based-deploy/README.md) — an in-cluster reconciler as the deployer for each environment.
- [CI/CD security and delivery](../README.md) — category index.
