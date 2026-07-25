---
title: "Workload Identity Federation (Generic Pattern)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Identity Federation (Generic Pattern)

**Status:** 🔵 Emerging

## What it is

The general pattern for letting a workload running in one trust domain obtain credentials
in a **target cloud** without any long-lived secret. The workload's own platform (GitHub
Actions, a Kubernetes cluster, another cloud) issues it a short-lived **OIDC ID token**
whose `iss` identifies the platform and whose `aud` names the target. The workload presents
that token to the target's Security Token Service (STS); the STS validates the token's
signature against the platform's published JWKS, checks `iss`/`aud`/`exp` and a configured
set of subject/claim **conditions**, and returns **short-lived target credentials** scoped
to a role or service account. Nothing is stored on disk; the only pre-shared state is the
one-time trust configuration registered at the target.

## When it is used

- CI/CD pipelines (GitHub Actions, GitLab, etc.) deploying to a cloud without stored keys.
- Cross-cloud access: a workload in cloud A calling cloud B.
- Kubernetes workloads exchanging a projected ServiceAccount token for cloud credentials — see [kubernetes-serviceaccount-token](../kubernetes-serviceaccount-token/README.md).
- The recommended replacement for [service-account-key-lifecycle](../service-account-key-lifecycle/README.md).

## Actors

| Actor | Role |
|---|---|
| Workload | The client needing target credentials; obtains and presents the OIDC token |
| Platform IdP | The workload platform's OIDC issuer; signs the ID token, publishes JWKS |
| Target STS | The target cloud's token/security-token service; validates and exchanges |
| Target API | The resource the credentials are used against |

## Key protocol details

- **Trust setup (one time)**: register the external OIDC issuer at the target (issuer URL + discovery/JWKS), define the audience the target expects, and map/condition on claims — subject, and issuer-specific claims like repository, branch, or namespace.
- **Token request**: the workload asks its platform IdP for an ID token with `aud` = the target's expected audience.
- **Exchange**: the workload calls the STS presenting the token. Concrete forms — AWS `AssumeRoleWithWebIdentity`, GCP Workload Identity Federation STS `token()` (RFC 8693 token exchange), Azure federated identity credential exchange for an AAD token.
- **Validation at STS**: signature via issuer JWKS, `iss` matches the registered issuer, `aud` matches, `exp`/`nbf` in range, and the `sub`/claim conditions in the target trust policy are satisfied.
- **Result**: short-lived credentials — AWS temporary STS keys, a GCP federated (optionally impersonated) access token, or an Azure access token — scoped to the mapped role/service account.

## Alternate scenarios covered

- Audience mismatch — token minted for the wrong `aud` is rejected (a key confused-deputy defense).
- Subject/claim condition not met — right issuer, wrong repo/branch/namespace → denied.
- Optional service-account impersonation step (GCP) after the initial federated token.
- Expired or clock-skewed token rejected by the STS.

## Security notes

- **Bind the audience.** The target must require a specific `aud` so a token issued for another relying party cannot be replayed here.
- **Condition on subject and claims**, not just issuer: without a `sub`/repo/branch/namespace condition, any workload from that issuer could assume the role (confused deputy).
- Issuers must be HTTPS with a discoverable, cached-but-refreshable JWKS; key rotation at the issuer must not silently break validation.
- Keep token TTLs short and request them per-exchange; never log the OIDC token or the resulting credentials.
- Scope the assumed role/service account to least privilege — federation removes the secret, not the need for tight authorization.

## Related diagrams

- [service-account-key-lifecycle](../service-account-key-lifecycle/README.md) — the legacy static-key approach this replaces.
- [kubernetes-serviceaccount-token](../kubernetes-serviceaccount-token/README.md) — the projected token most often exchanged this way.
- [secretless-instance-identity](../secretless-instance-identity/README.md) — the on-VM equivalent when the workload already runs on the target cloud.
- [cloud-iam/aws/sts-assumerole](../../platforms/cloud-iam/aws/sts-assumerole/README.md), [cloud-iam/gcp/workload-identity-federation](../../platforms/cloud-iam/gcp/workload-identity-federation/README.md), [cloud-iam/entra/workload-identity-federation](../../platforms/cloud-iam/entra/workload-identity-federation/README.md) — vendor specifics.
- [oidc/authorization-code-pkce](../../authentication/oidc/authorization-code-pkce/README.md) — OIDC token validation fundamentals.

## Files

- [sequence.md](./sequence.md) — trust setup, token issuance, exchange, and validation with alt blocks.
- [swimlane.md](./swimlane.md) — lanes for Workload, Platform IdP, Target STS, Target API.
- [flowchart.md](./flowchart.md) — STS validation gates and error terminals.
</content>
