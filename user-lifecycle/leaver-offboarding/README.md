# Leaver — Offboarding & Deprovisioning

**Status:** ✅ Current

## Purpose

The **leaver** flow removes access when a worker exits. A termination event from the HR
source of truth drives the **IGA engine** to shut the identity down in a deliberate order:
**disable** the IdP account first (fastest way to stop new logins), **revoke active
sessions and tokens** (so already-logged-in sessions die), **deprovision** every downstream
application, **reclaim** licenses and devices, **archive or transfer** the leaver's data,
and finally **delete** the account once the mandated **retention period** expires.

Order matters. Disabling the account before deprovisioning apps closes the login door
immediately even if downstream cleanup takes minutes or hours. Session/token revocation is
what makes disablement effective *now* rather than at next login — a live OAuth refresh
token or SSO session can outlive a disabled account otherwise.

## When it's used

- An employee resigns or is terminated and their HR record moves to a terminated state.
- A contractor's engagement ends (often a scheduled end date rather than an event).
- Security incident response requiring immediate access kill for a specific user.

## Actors

| Actor | Role |
|---|---|
| `HR` | Source of truth emitting the termination / end-date event |
| `IGA` | Orchestrates the ordered teardown |
| `IdP` | Disables the account and revokes sessions/tokens |
| `App` | Downstream application being deprovisioned |
| `IT` | Reclaims devices/licenses and handles data archive/transfer |

## Teardown order

1. **Disable** IdP account (`active=false`) — block new authentications.
2. **Revoke** sessions and tokens — kill live SSO sessions, OAuth access/refresh tokens.
3. **Deprovision** apps — remove entitlements, SCIM `DELETE`/`active=false`.
4. **Reclaim** licenses and devices — free paid seats, wipe/collect hardware.
5. **Archive/transfer** data — mailbox, files, ownership handed to manager.
6. **Delete** — after the retention window, hard-delete the account and residual data.

## Alternate scenarios covered

- **Immediate / for-cause instant kill** — security-triggered termination that runs the
  disable + session/token revoke steps *immediately* and in parallel, ahead of the normal
  notice-period schedule.
- **Rehire re-enable within window** — a former worker returns before deletion; the
  disabled-but-retained account is re-enabled instead of a new one being created.
- **Orphaned-account cleanup** — accounts with no matching active HR record (contractors
  whose feed lapsed, service accounts) are detected and remediated.

## Alternate & related flows

- [joiner-onboarding](../joiner-onboarding/README.md) — a rehire diverts back here to re-enable.
- [mover-role-change](../mover-role-change/README.md) — partial revocation, versus the full teardown here.
- [access-review-certification](../access-review-certification/README.md) — a revoke decision in a review can trigger this deprovisioning.
- [scim-provisioning](../scim-provisioning/README.md) — the SCIM DELETE / active=false mechanics.
- [jml-orchestration](../jml-orchestration/README.md) — where this fits in the overall lifecycle.

## Related diagrams

- [RP-Initiated Logout](../../oidc/rp-initiated-logout/README.md) — one mechanism for ending the IdP session being revoked.
- [SAML Single Logout (SP-Initiated)](../../saml/slo-sp-initiated/README.md) — propagating session termination to federated apps.
- [Session Cookie](../../tokenless/session-cookie/README.md) — the local sessions that must be invalidated, not just the federated ones.

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — message-level teardown exchange
- [swimlane.md](swimlane.md) — responsibilities per actor lane
- [flowchart.md](flowchart.md) — teardown decision logic and retention/delete gate
