---
title: "Service-Account Key Lifecycle"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Service-Account Key Lifecycle

**Status:** 🟡 Legacy

> **Prefer short-lived, attested credentials.** Long-lived static service-account keys are
> discouraged: they do not expire on their own, are easily copied, and tend to sprawl across
> repos, CI systems, and laptops. Where the platform supports it, use
> [workload-identity-federation-generic](../workload-identity-federation-generic/README.md),
> [secretless-instance-identity](../secretless-instance-identity/README.md), or
> [kubernetes-serviceaccount-token](../kubernetes-serviceaccount-token/README.md) instead.
> This diagram documents the static-key lifecycle because it is still widely deployed and
> must be operated safely where it cannot yet be removed.

## What it is

A long-lived credential bound to a service account: a GCP service-account **JSON key** (a
private key used to sign a JWT assertion for the OAuth 2.0 service-account / `jwt-bearer`
grant), or an AWS IAM user **access key ID + secret** (used directly for SigV4 request
signing). Unlike federated or instance credentials, the secret is minted once and stays
valid until it is explicitly rotated or revoked. The lifecycle is therefore an operational
loop: **issue → store → use → rotate → revoke**.

## When it is used

- Off-cloud or third-party systems that cannot obtain a platform OIDC token or run on an instance with an attached identity.
- Legacy automation and integrations predating federation support.
- Break-glass or bootstrap scenarios where no attestation source exists yet — kept tightly scoped and short-dated.

## Actors

| Actor | Role |
|---|---|
| Admin | Creates, rotates, and revokes keys; sets rotation policy |
| Cloud IAM | The provider's identity service that mints and validates keys |
| Secret Store | Vault / cloud secret manager holding the key material |
| Workload | Consumer that reads the key and authenticates with it |

## Key protocol details

- **Issuance**: IAM generates a keypair (GCP) or access key (AWS) and returns the secret **once** — it cannot be retrieved again. The public half / key ID is retained by IAM for verification.
- **Storage**: the secret is written to a managed secret store (never to a repo or image). Access to the store is itself controlled and audited.
- **Use**: GCP — the workload signs a JWT with the private key and exchanges it at the token endpoint for a short-lived access token. AWS — the workload signs each request with SigV4 using the secret access key.
- **Rotation**: create a new key, distribute it, switch the workload over, **deactivate** the old key, monitor for use of the old key, then **delete** it. This overlap window avoids downtime.
- **Revocation**: on suspected compromise, disable/delete the key immediately; downstream tokens already minted from a GCP key remain valid until they expire, so also constrain token TTLs.

## Alternate scenarios covered

- Scheduled rotation with a dual-key overlap window (make-before-break).
- Emergency revocation on compromise, with the residual-token-TTL caveat.
- Rotation failure — old key deleted before the new one is deployed → outage terminal.
- Leaked key detected in a public repo → forced revocation.

## Security notes

- **Static keys are the highest-value secret to steal**; minimize their number, scope each to least privilege, and prefer removing them entirely via federation.
- Never commit keys to source control or bake them into images; store them in a secret manager with audit logging and short lease/rotation intervals.
- Rotate on a schedule *and* on personnel/role changes; alert on any use of a key past its intended rotation date.
- Constrain the derived token TTL (GCP) so a stolen key's blast radius shrinks after revocation.
- Enable provider key-usage logging and automated leaked-credential scanning.

## Related diagrams

- [workload-identity-federation-generic](../workload-identity-federation-generic/README.md) — the recommended secret-free replacement.
- [secretless-instance-identity](../secretless-instance-identity/README.md) — on-VM alternative with no stored key.
- [cloud-iam/gcp/application-default-credentials](../../platforms/cloud-iam/gcp/application-default-credentials/README.md) — how ADC prefers attached/federated identity over JSON keys.
- [cloud-iam/gcp/service-account-impersonation](../../platforms/cloud-iam/gcp/service-account-impersonation/README.md) — short-lived impersonation instead of downloaded keys.
- [password-management/](../../identity-lifecycle/password-management) — the human-secret analogue of rotation and revocation.

## Files

- [sequence.md](./sequence.md) — issue, store, use, rotate, and revoke with alt blocks.
- [swimlane.md](./swimlane.md) — lanes for Admin, Cloud IAM, Secret Store, Workload.
- [flowchart.md](./flowchart.md) — lifecycle decisions and failure/outage terminals.
</content>
