---
title: "Password Hash Synchronization (PHS)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Password Hash Synchronization (PHS)

**Status:** ✅ Current

## What it is

Password Hash Synchronization copies a **hash of the on-premises password hash** from an
enterprise directory (Active Directory) up to a cloud identity provider (Microsoft Entra ID
is the canonical example) so that users sign in to cloud services with the **same password**
they use on-prem — but authentication is performed **entirely in the cloud**. No on-prem
component is contacted at sign-in time.

The critical detail is **hash-of-a-hash**. A sync agent (Entra Connect / Cloud Sync) reads
the AD account's stored `NT hash` (an unsalted MD4 of the password), then applies **PBKDF2
with HMAC-SHA256, 1000 iterations, and a per-user salt** to that hash. Only this derived,
salted, re-hashed value is transmitted and stored in the cloud. The plaintext password never
leaves the domain controller, and the cloud never holds the reversible NT hash.

At sign-in, the cloud IdP hashes the presented password the same way and compares — a
standard cloud credential check, fully independent of on-prem availability.

## When it is used

- Organizations moving to cloud SSO that want the simplest, most resilient sign-in: it keeps
  working during on-prem outages and needs no inbound firewall openings.
- As the recommended **managed authentication** method and as a **backup/failover** for
  federated or pass-through deployments (leakage-of-credentials reports also depend on it).
- Any scenario where "same password in the cloud, but validated in the cloud" is desired.

## Actors

| Actor | Role |
|---|---|
| `User` | Human signing in with their corporate password |
| `Agent` | Sync engine (Entra Connect / Cloud Sync) reading and hashing on-prem hashes |
| `Directory` | On-prem source directory (Active Directory) holding the NT hashes |
| `IdP` | Cloud identity provider storing the derived hash and validating sign-ins |

## Key details

- Sync is **incremental**, every ~2 minutes for password changes (separate from the ~30-minute
  object sync), so a password change on-prem is reflected in the cloud within minutes.
- The stored artifact is `PBKDF2(HMAC-SHA256, NThash, salt, 1000)` — it is **not** reversible
  to the password and **not** the NT hash itself, so it cannot be replayed on-prem.
- Authentication is **cloud-only**: the on-prem directory can be completely offline and cloud
  sign-in still succeeds. Contrast with
  [Pass-through Authentication](../pass-through-authentication/README.md), which validates live
  against AD.
- PHS is a facet of the broader
  [Entra hybrid identity sync](../../cloud-iam/entra/hybrid-identity-sync/README.md) that also
  provisions users, groups, and attributes.

## Alternate scenarios covered

- **Happy path** — initial hash sync, then a cloud-validated sign-in.
- **Password change on-prem** — incremental re-sync propagates the new hash within minutes.
- **On-prem outage at sign-in** — cloud sign-in still works (the PHS resilience story).
- Sync agent failure / lag, and Conditional Access / MFA step-up layered on top.

## Security notes

- The derived hash is **not** the NT hash and cannot be used for pass-the-hash on-prem, but it
  is still credential-adjacent material — protect the cloud tenant and the sync account
  (least privilege, MFA, no interactive use of the `MSOL_`/sync service account).
- **Leaked-credential detection**: because the cloud holds a verifier, the IdP can flag users
  whose passwords appear in breach corpora — a benefit unavailable to pure federation.
- On-prem password **policy still governs** because the password is set in AD; cloud
  Conditional Access, MFA, and risk-based policies apply at cloud sign-in on top of PHS.
- Rotating/deprovisioning on-prem accounts must propagate; a disabled AD account should sync as
  disabled so cloud sign-in is blocked — verify sync scoping and filtering.
- PHS does not remove the value of retiring the weak unsalted NT hash on-prem; enforce strong
  password policy and MFA regardless.

## Related diagrams

- [Pass-through Authentication](../pass-through-authentication/README.md) — same-password sign-in validated live on-prem instead
- [Federated vs Managed Authentication](../federated-vs-managed-auth/README.md) — where PHS sits as the managed option
- [Entra Hybrid Identity Sync](../../cloud-iam/entra/hybrid-identity-sync/README.md) — the full directory sync PHS is part of
- [HR-Driven Inbound Provisioning](../hr-driven-inbound-provisioning/README.md) — how the accounts being synced are created
- [Conditional Access Evaluation](../../cloud-iam/entra/conditional-access-evaluation/README.md) — policy applied at the cloud sign-in

## Files

- [sequence.md](sequence.md) — hash sync and cloud sign-in with alternates
- [swimlane.md](swimlane.md) — lanes for User, Agent, Directory, IdP
- [flowchart.md](flowchart.md) — sync and authentication decision logic
