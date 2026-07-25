---
title: "Mover — Role Change & Access Re-evaluation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Mover — Role Change & Access Re-evaluation

**Status:** ✅ Current

## Purpose

The **mover** flow handles the hardest part of identity governance: a worker who *stays* in
the organization but changes what they do. A change to an authoritative attribute
(department, job code, manager, location, cost center) triggers the **IGA engine** to
**re-evaluate** the worker's entire access footprint against their new role. Crucially,
this is not additive — it must both **grant** the entitlements the new role needs *and*
**revoke** the ones the old role granted that are no longer justified. Skipping the
revocation half is how organizations accumulate **privilege creep** (over-entitled users
who moved through many roles without ever losing anything).

New grants pass through a **separation-of-duties (SoD)** check — a policy that forbids one
person from holding two conflicting entitlements (e.g. *create vendor* and *approve
payment*) — and, where required, owner/manager approval before they take effect.

## When it's used

- A worker is promoted, transferred between departments, or gets a new manager.
- A job-code change alters the RBAC roles a worker qualifies for.
- Any attribute change in HR that IGA maps to an access-relevant policy.

## Actors

| Actor | Role |
|---|---|
| `HR` | Source of truth emitting the attribute-change event |
| `IGA` | Re-evaluates access, runs SoD, orchestrates add/revoke |
| `IdP` | Applies group membership add/remove |
| `App` | Downstream application gaining or losing entitlements |
| `Manager` | Approves new grants and confirms revocations |

## Key concepts

- **Access re-evaluation** — recompute the target entitlement set from the new attributes,
  then diff it against the current set to derive *adds* and *revokes*.
- **Stale-access revocation** — entitlements from the prior role that the new role does not
  justify are removed, subject to a grace window where configured.
- **Separation of Duties (SoD)** — a preventive control; a requested grant that would
  create a toxic combination with an existing entitlement is blocked or sent to exception
  review.
- **Grace window (dual access)** — for lateral or handover moves, some old access is kept
  for a bounded period so the worker can transition work, then auto-revoked.

## Alternate scenarios covered

- **Lateral move keeps some access** — overlapping entitlements common to both roles are
  retained rather than revoked-and-re-granted.
- **Temporary dual access grace window** — old-role access is time-boxed and expires
  automatically instead of being cut immediately.
- **SoD violation blocks the grant** — a new entitlement conflicts with one the user
  keeps; the grant is denied or routed to SoD exception approval.

## Alternate & related flows

- [joiner-onboarding](../joiner-onboarding/README.md) — the initial access this flow mutates.
- [leaver-offboarding](../leaver-offboarding/README.md) — full revocation when the worker exits entirely.
- [access-review-certification](../access-review-certification/README.md) — the periodic control that catches privilege creep this flow tries to prevent.
- [scim-provisioning](../scim-provisioning/README.md) — how adds/removes are pushed to apps.
- [jml-orchestration](../jml-orchestration/README.md) — where this fits in the overall lifecycle.

## Related diagrams

- [Identity Provider reference architecture](../../../infrastructure/architecture/identity-provider-reference-architecture/README.md) — where the IGA policy engine sits relative to the IdP.

## Files

- [README.md](./README.md) — this document
- [sequence.md](./sequence.md) — message-level re-evaluation exchange
- [swimlane.md](./swimlane.md) — responsibilities per actor lane
- [flowchart.md](./flowchart.md) — grant/revoke decision logic with SoD gate
