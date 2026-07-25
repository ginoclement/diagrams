---
title: "Group Membership Sync"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Group Membership Sync

**Status:** ✅ Current

## What it is

Group membership sync keeps **groups, roles, and entitlements** consistent between a source
directory (Entra ID, on-prem AD, an IGA platform) and downstream applications. A sync
engine reads in-scope group definitions and their members from the source, **flattens
nested groups** into an effective member list, **maps** each source group to a target
group / role / entitlement, computes the **delta** against the app's current state, and
then **grants added members and revokes removed members**.

The load-bearing behaviors are: **nested-group flattening** (a user who is a member only
through a child group must appear in the effective set), **deprovision on removal** (leaving
the source group must revoke the downstream entitlement, not just stop granting it), and
**conflict handling** when the target was changed out of band.

## When it is used

- Driving app access from directory groups so "add to the `Finance-App-Users` group" grants
  the app, and removal revokes it — the standard entitlement model for SaaS and on-prem apps.
- As the entitlement half of provisioning: [SCIM](../../user-lifecycle/scim-provisioning/README.md)
  and [HR-driven provisioning](../hr-driven-inbound-provisioning/README.md) create the
  accounts, group sync assigns what they can do.
- Anywhere authorization is group-based and must stay accurate as membership changes —
  including feeding [access reviews](../../user-lifecycle/access-review-certification/README.md).

## Actors

| Actor | Role |
|---|---|
| `Directory` | Source of truth for group definitions and memberships (may be nested) |
| `Sync` | Sync engine; flattens, maps, diffs, and pushes grants/revokes |
| `App` | Downstream application receiving group/role/entitlement changes |

## Key details

- **Nested-group flattening** expands transitive membership into a flat effective set, with
  **cycle detection** and a **depth guard** so circular or deeply nested groups do not loop
  forever. Most target apps consume a flat member list, not a group hierarchy.
- **Mapping** relates a source group to a target construct (group, role, license,
  entitlement); only mapped, in-scope groups are synced.
- **Delta computation** compares the desired effective membership to the app's current
  membership and produces **adds** and **removes**.
- **Deprovision on removal** applies the removes: a user dropped from the source group has
  the downstream entitlement **revoked**, closing the standing-access gap.
- **Conflict handling** decides what happens when the target was changed out of band — the
  source is normally **authoritative** (reconcile back), with genuinely ambiguous cases
  quarantined for review rather than blindly overwritten.
- **Ordering**: a member whose account is not yet provisioned in the app is **deferred**
  until the account exists, avoiding orphaned entitlement grants.

## Alternate scenarios covered

- **Happy path** — flatten, map, diff, grant adds and revoke removes.
- **Nested membership** — a user in via a child group appears in the effective set.
- **Deprovision on removal** — leaving the source group revokes the entitlement downstream.
- **Circular nesting** — cycle detected, broken, and flagged; sync still completes.
- **Member not yet provisioned** — grant deferred until the account exists.
- **Out-of-band / conflict** — source authoritative reconcile, or quarantine if ambiguous.
- **Target group missing** — mapping error surfaced, that group skipped.

## Security notes

- **Deprovision on removal is the key control**: if removals are not applied, access
  accumulates and a former member keeps entitlements — treat a failed revoke as an incident.
- Flatten with cycle and depth limits; an attacker who can create nested groups could
  otherwise cause a denial of service or an unexpected effective-access blowup.
- Keep the source authoritative and audit every grant/revoke with its cause; out-of-band
  privilege grants in the target should be reconciled away, not silently preserved.
- Watch for **mapping drift** — a renamed or deleted source group can quietly strip access
  from everyone mapped to it; alert on large membership swings before applying them.
- Feed the reconciled membership into
  [access certification](../../user-lifecycle/access-review-certification/README.md) so
  entitlements are periodically re-attested, not just synced.

## Related diagrams

- [SCIM Provisioning](../../user-lifecycle/scim-provisioning/README.md) — provisions the accounts these groups grant entitlements to
- [HR-Driven Inbound Provisioning](../hr-driven-inbound-provisioning/README.md) — attribute changes that drive group membership
- [Mover / Role Change](../../user-lifecycle/mover-role-change/README.md) — the role changes that add and remove group membership
- [Leaver / Offboarding](../../user-lifecycle/leaver-offboarding/README.md) — full removal that this sync's revokes support
- [Access Review / Certification](../../user-lifecycle/access-review-certification/README.md) — periodic attestation of the synced entitlements
- [Active Directory Interactive Logon](../active-directory-logon/README.md) — where flattened group SIDs land in the logon token

## Files

- [sequence.md](sequence.md) — read, flatten, diff, grant/revoke with conflict branches
- [swimlane.md](swimlane.md) — lanes for Directory, Sync, App
- [flowchart.md](flowchart.md) — per-member decision logic and error terminals
