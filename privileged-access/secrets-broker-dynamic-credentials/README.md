---
title: "Secrets Broker with Dynamic Credentials"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Broker with Dynamic Credentials

**Status:** 🔵 Emerging

## What it is

Instead of storing a long-lived database password or cloud API key in a config file or even
a static vault entry, the workload asks a **secrets broker** to **mint a credential on
demand**. The workload first authenticates to the broker using a **workload identity**
(a Kubernetes / cloud IAM identity, a signed JWT, a platform-issued token). The broker
checks policy for that identity, then calls the **target system's admin plane** to
**create an ephemeral principal** — a brand-new database user with exactly the needed
grants, or a set of short-lived cloud STS keys — and returns it wrapped in a **lease** with
a **TTL**. The workload uses the credential for the length of the lease, optionally
**renewing** it up to a **max TTL**, and at expiry (or on explicit **revoke**) the broker
**tears the ephemeral principal down** at the backend so the credential stops working. No
human ever sees the secret, nothing long-lived is stored, and every credential is
uniquely attributable to one lease. The canonical implementation is HashiCorp Vault's
dynamic secrets engines; cloud-native equivalents include IAM Roles Anywhere and short-lived
STS / workload-identity federation.

## When it is used

- Application-to-database and application-to-cloud access, replacing embedded static
  credentials that never rotate and leak into logs, images, and repos.
- Zero-standing-secret architectures where a compromised host yields at most a
  short-lived, narrowly scoped credential that auto-expires.
- Fine-grained, per-lease attribution and instant blast-radius containment: revoke one
  lease and only that consumer loses access.

## Actors

| Actor | Role |
|---|---|
| Client | Workload / application requesting a credential |
| Broker | Secrets broker that authenticates the workload, enforces policy, and manages leases |
| Backend | The target system's admin plane where the broker creates and destroys the ephemeral principal (DB engine, cloud IAM / STS) |
| Resource | The database or cloud API the minted credential actually accesses |

## Alternate scenarios covered

- **Mint and use** — workload authenticates, broker creates a short-lived credential with a
  lease + TTL, workload uses it against the resource.
- **Lease renewal** — the workload renews before expiry to extend the lease, bounded by a
  hard **max TTL** after which it must request a fresh credential.
- **Expiry / auto-revoke** — at TTL the broker deletes the ephemeral principal at the
  backend with no workload action, and the credential stops working.
- **Early revoke** — an operator or breach response revokes the lease immediately, tearing
  down the principal before its TTL.
- **Policy denial** — the workload identity is not entitled to the requested role; the
  broker issues nothing.

## Security notes

- **The workload identity is the root of trust.** If it can be spoofed, so can every
  credential the broker mints — bind it to platform attestation (IRSA, SPIFFE, cloud
  instance identity), not a shared bootstrap token.
- **Short TTLs beat rotation.** A credential that lives for minutes rarely needs rotating
  and is nearly worthless if exfiltrated; keep TTL and max TTL as small as the workload
  tolerates.
- **Revocation must actually reach the backend.** Auto-revoke and early revoke are only
  real if the broker reliably deletes the DB user / STS grant; monitor for orphaned
  ephemeral principals that outlive their lease.
- **Least-privilege the minted role.** Each dynamic role should grant only what that
  workload needs; a broad dynamic credential is still a broad credential for its lifetime.
- **Protect and audit the broker.** It holds the backend admin credentials used to create
  principals — seal / unseal it carefully, keep its root credentials in an HSM / KMS, and
  log every issuance, renewal, and revocation.

## Related diagrams

- [ssh-bastion-jump-host](../ssh-bastion-jump-host/README.md) — the same short-lived-credential idea for interactive SSH rather than machine-to-service.
- [credential-vault-checkout](../credential-vault-checkout/README.md) — checking out a *static shared* secret, the pattern dynamic secrets improve on.
- [jit-privilege-elevation](../jit-privilege-elevation/README.md) — time-boxing a human's *role*, as this time-boxes a workload's *credential*.
- [session-recording-monitoring](../session-recording-monitoring/README.md) — recording the human sessions that sit alongside these machine credentials.

## Files

- [sequence.md](./sequence.md) — authenticate → policy → mint ephemeral credential with lease → use → renew / auto-revoke, plus early-revoke and denial alternates.
- [swimlane.md](./swimlane.md) — lanes for Client, Broker, Backend, Resource.
- [flowchart.md](./flowchart.md) — issuance and lease-lifecycle decisions with explicit deny and expiry terminals.
