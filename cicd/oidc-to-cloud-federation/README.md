---
title: "OIDC Federation from CI to Cloud (Keyless Deploy)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Federation from CI to Cloud (Keyless Deploy)

**Status:** 🔵 Emerging

## Purpose

Deploy from a CI pipeline to a cloud provider with **no long-lived stored cloud
credentials**. The CI system acts as an OIDC identity provider: for each job it mints a
short-lived, signed JWT (an ID token) describing the workflow — claims like
`sub=repo:org/repo:ref:refs/heads/main`, `aud`, `actor`, `environment`. The cloud provider
is configured to trust that CI issuer through an OIDC identity provider / trust policy, and
**exchanges the JWT for short-lived cloud credentials**:

- **AWS** — `sts:AssumeRoleWithWebIdentity` returns temporary role credentials.
- **GCP** — Workload Identity Federation returns a federated access token, optionally via
  service-account impersonation.
- **Azure** — workload identity federation returns an Entra ID (AAD) access token.

The exchange only succeeds if the JWT's signature verifies against the issuer's JWKS **and**
its claims satisfy the trust policy's conditions (subject, audience, and often environment or
ref). No secret ever leaves the CI system, and the credentials the job receives expire in
minutes.

## When it's used

- GitHub Actions, GitLab CI, or similar deploying to AWS / GCP / Azure without storing static
  access keys in CI secrets.
- Any pipeline that wants per-workflow, claim-scoped access instead of one shared key with a
  broad blast radius.
- Replaces the [⛔ deprecated](#why-the-stored-key-approach-is-deprecated) pattern of pasting
  long-lived cloud access keys into CI secret storage.

## Actors / components

| Actor | Role |
|---|---|
| Job | The CI job/workflow requesting cloud access |
| CI OIDC | CI system's OIDC token endpoint / issuer; signs the workflow JWT, publishes JWKS |
| STS | Cloud token/credential broker (AWS STS, GCP STS + IAM, Entra ID) |
| Trust | Configured OIDC identity provider + trust policy / condition on the cloud side |
| Cloud | Target cloud APIs the job deploys against |

## Alternate scenarios covered

- **GCP Workload Identity Federation variant** — exchange the JWT at GCP STS, then impersonate
  a service account to obtain a scoped access token.
- **Azure workload identity federation variant** — federated credential on an app registration
  yields an Entra ID access token.
- **Misconfigured trust policy (the danger)** — a wildcard subject condition
  (`repo:org/*` or an unpinned `sub`) lets a **fork or unrelated repo** assume the role. Shown
  as the failure, then the fix: pin `sub` to the exact repo **and** ref/environment.
- **Audience mismatch** — JWT `aud` does not equal the value the trust policy expects → the
  exchange is rejected.
- **Expired short-lived credentials** — the returned temp credentials outlive their TTL
  mid-job → the job re-requests a token rather than caching a static secret.
- **⛔ Long-lived stored cloud access keys** — the contrast pattern (see below), depicted as a
  rejected/deprecated branch in the diagrams.

## Security notes

- Scope the trust policy `sub` **and** `aud` tightly; **never wildcard the subject**.
- Pin to a branch/ref (`ref:refs/heads/main`) or, better, an `environment` claim so only
  protected-environment jobs can assume the role.
- Keep credential TTL short; do not persist or cache the exchanged credentials beyond the job.
- Prefer environment-scoped OIDC subjects over repo-wide ones — the smaller the claim, the
  smaller the blast radius.
- Audit which roles/service accounts are assumable by which repos and refs; a single loose
  condition undoes the whole model.
- Validate the issuer's signature via JWKS; trust the issuer URL from configuration, never a
  key embedded in the token alone.

## Why the stored-key approach is deprecated

Pasting long-lived cloud access keys (AWS access key + secret, a GCP service-account JSON key,
or an Azure client secret) into CI secret storage is **⛔ Deprecated**:

- The keys **never expire** — a leak grants standing access until someone notices and rotates.
- **Large blast radius** — one key is typically shared across every job and often over-scoped.
- **Hard to rotate** — rotation means editing secrets in every repo/pipeline that holds a copy.
- **Leaks easily** — static secrets end up echoed in logs, forked-PR contexts, and exfiltrated
  environment dumps.

## Use instead

The OIDC federation flow on this page: short-lived, claim-scoped credentials minted per job,
with no static secret stored in CI. See [sequence.md](sequence.md) for the exchange.

## Diagrams

- [sequence.md](sequence.md) — GitHub Actions → AWS happy path, plus GCP/Azure variants and rejection alternates.
- [swimlane.md](swimlane.md) — lanes for Job, CI OIDC, STS, Cloud, with the deprecated stored-key branch.
- [flowchart.md](flowchart.md) — trust-policy validation gates with explicit deny terminals.

## Related diagrams

- [AWS AssumeRoleWithWebIdentity (OIDC)](../../cloud-iam/aws/assumerole-web-identity-oidc/README.md) — the STS exchange in detail.
- [GCP Workload Identity Federation](../../cloud-iam/gcp/workload-identity-federation/README.md) — the GCP variant.
- [Entra workload identity federation](../../cloud-iam/entra/workload-identity-federation/README.md) — the Azure variant.
- [Secrets management in pipelines](../secrets-management-in-pipelines/README.md) — what to do when a static secret is unavoidable.
- [Ephemeral runner isolation](../ephemeral-runner-isolation/README.md) — keeping the minted token off shared infrastructure.
- [CI/CD security and delivery](../README.md) — category index.
