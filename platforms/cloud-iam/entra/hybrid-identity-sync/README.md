---
title: "Entra Hybrid Identity Sync (PHS vs PTA vs Federation)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Entra Hybrid Identity Sync (PHS vs PTA vs Federation)

**Status:** ✅ Current

## What it is

Hybrid identity connects an on-premises Active Directory to Microsoft Entra ID so users sign in to
cloud apps with their existing corporate account. **Entra Connect** (and the newer lightweight
**Entra Connect cloud sync**) synchronizes user objects; the choice that matters is **how the
password / authentication is handled**. There are three sign-in methods:

- **Password Hash Sync (PHS)** — a hash *of the AD password hash* is synced to Entra. Entra
  validates sign-in itself; on-prem does not need to be reachable at sign-in time. The default and
  recommended method.
- **Pass-Through Authentication (PTA)** — no password material is stored in the cloud. A
  lightweight on-prem **PTA agent** validates the password against AD in real time; Entra brokers
  the credential to the agent over an outbound-only channel.
- **Federation (AD FS)** — Entra redirects authentication to an on-prem **AD FS** farm that issues
  the token; the cloud trusts AD FS. Powerful but heavy to run and a large availability/security
  surface, so it is now discouraged for most tenants in favor of PHS/PTA.

PHS and PTA can both layer **Seamless SSO** for silent Kerberos-based sign-in on domain-joined
devices.

## When it is used

- Any organization with on-prem AD wanting cloud SSO to Microsoft 365 / Entra apps.
- PHS: the default for nearly all tenants; also enables leaked-credential detection.
- PTA: when policy forbids any password hash (even a hash of a hash) from leaving on-prem.
- Federation: only where a hard requirement (smart-card-only, on-prem MFA appliance, existing AD FS
  investment) still demands it.

## Actors

| Actor | Role |
|---|---|
| User | Employee signing in to a cloud app with their corporate account |
| Entra | Microsoft Entra ID: brokers sign-in and issues tokens |
| Connect | Entra Connect sync engine syncing directory objects (and password hashes for PHS) |
| Agent | On-prem PTA agent (PTA) or AD FS farm (Federation) validating credentials |
| AD | On-premises Active Directory, the source of truth for passwords |

## Alternate scenarios covered

- **PHS** happy path — Entra validates the password itself, on-prem outage does not block sign-in.
- **PTA** happy path — the PTA agent validates against AD over an outbound-only channel.
- **AD FS Federation** (🟡 Legacy) — Entra redirects to AD FS, which issues the token.
- Seamless SSO silent Kerberos sign-in layered on PHS or PTA.
- On-prem / agent outage: PHS keeps working; PTA and Federation fail sign-in.

## Security notes

- PHS syncs a hash of the AD hash (PBKDF2/HMAC-SHA256 over the NT hash), not the plaintext or a
  reversible secret; it also powers Entra leaked-credential risk detection.
- PTA agents make only outbound connections and hold a certificate registered with the tenant;
  protect the agent servers as tier-0 assets.
- AD FS is a high-value target — token-signing key theft (Golden SAML) forges any user's token;
  keep it patched, isolate it, and prefer migrating off it.
- Keep PHS enabled even when using PTA/Federation as a backup sign-in method for resilience.
- Seamless SSO uses a computer account (`AZUREADSSOACC`); rotate its Kerberos key regularly.

## Legacy note — AD FS Federation

- **Why legacy:** heavy to operate (farm, WAP proxies, certificates), a large attack surface, and
  a single point of failure for all cloud sign-in; PHS/PTA cover the same needs more simply.
- **Use instead:** Password Hash Sync (default) or Pass-Through Authentication, both shown here,
  optionally with Seamless SSO.

## Related diagrams

- [Primary Refresh Token](../primary-refresh-token/README.md) — how the resulting Entra session is materialized on the device.
- [Windows Hello for Business](../windows-hello-for-business/README.md) — passwordless sign-in that builds on hybrid/joined devices.
- [Device join and registration](../device-join-registration/README.md) — how devices become known to Entra alongside identity sync.
- [Conditional Access evaluation](../conditional-access-evaluation/README.md) — policy applied after the chosen sign-in method authenticates.

## Files

- [sequence.md](./sequence.md) — PHS happy path, with PTA and AD FS Federation alternates and Seamless SSO.
- [swimlane.md](./swimlane.md) — lanes for User, Entra, Connect, Agent, AD.
- [flowchart.md](./flowchart.md) — the sign-in-method decision tree with per-method failure terminals.
