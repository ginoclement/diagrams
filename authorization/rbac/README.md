---
title: "Role-Based Access Control (RBAC)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Role-Based Access Control (RBAC)

**Status:** ✅ Current

## What it is

RBAC decides access by **role**, not by listing permissions per user. Users are assigned to one
or more **roles**; each role bundles a set of **permissions** (an action on a resource type, e.g.
`invoice:approve`). A subject may perform an action if **any** role assigned to them grants the
matching permission. This is the ANSI/INCITS 359 model: the core relations are
`User → Role` (assignment) and `Role → Permission` (grant), with an optional **role hierarchy**
where senior roles inherit the permissions of junior roles, and optional **sessions** that
activate a subset of a user's roles at a time (least privilege).

## When it is used

- The default authorization model in most enterprise apps, SaaS admin consoles, and cloud IAM
  (AWS IAM roles, Kubernetes RBAC, Entra ID / Azure roles, database `GRANT ... TO role`).
- Good fit when access maps cleanly onto **job functions** ("Billing Clerk", "Auditor", "Admin")
  and the permission set is relatively stable.
- Frequently the coarse layer beneath a finer model: a role check gates the endpoint, then
  [ReBAC](../rebac-zanzibar/README.md) or [ABAC](../abac/README.md) decides the specific object.

## Actors and components

| Component | Role |
|---|---|
| User | The subject requesting an action |
| Role | Named bundle of permissions, assigned to users |
| Permission | An `action` on a `resource type` (e.g. `report:read`) granted to a role |
| Role hierarchy | Senior-to-junior inheritance so a senior role gets junior permissions |
| Session | Runtime activation of a subset of the user's roles (constrained RBAC) |
| PEP | The app/enforcement point that checks "does an active role grant this permission?" |

## Alternate scenarios covered

- **Role hierarchy inheritance** — permission granted via a junior role a senior role inherits.
- **Static Separation of Duty (SSD)** — a user is barred from holding two conflicting roles.
- **Dynamic Separation of Duty (DSD)** — conflicting roles may be held but not activated in the
  same session.
- **Role explosion** — the anti-pattern where per-tenant/per-region/per-attribute distinctions
  are encoded as ever more roles (`Approver-EU-Tier1`, `Approver-US-Tier2`, ...), and why that
  signals a move to [ABAC](../abac/README.md) or [ReBAC](../rebac-zanzibar/README.md).

## Security notes

- **Least privilege**: prefer many narrow roles activated per session over a few broad roles;
  use constrained RBAC sessions so users do not carry every permission at all times.
- **Separation of Duty** guards against fraud (the person who creates a payment cannot also
  approve it); enforce SSD at assignment time and DSD at activation time.
- **Role explosion** erodes RBAC's benefit: when the number of roles approaches the number of
  users, or roles encode data values (region, owner, tier), you have rebuilt ABAC badly. Move
  contextual conditions into attributes/relationships instead of new roles.
- **Review and recertify** role assignments periodically — stale membership is the most common
  source of over-privilege; tie it to [joiner-mover-leaver](../../identity-lifecycle/user-lifecycle/README.md).
- RBAC alone cannot express "owner of *this* record" or "same department as the resource" — those
  are relationship/attribute conditions; do not fake them with roles.

## Related diagrams

- [ABAC](../abac/README.md) — attributes replace/augment roles when context matters.
- [ReBAC / Zanzibar](../rebac-zanzibar/README.md) — per-object relationships instead of global roles.
- [Scopes, claims, entitlements](../scopes-claims-entitlements/README.md) — roles often ride in a
  token claim as the coarse layer.
- [Policy decision and enforcement](../policy-decision-enforcement/README.md) — where the role
  check runs at a gateway/sidecar.
- [User lifecycle](../../identity-lifecycle/user-lifecycle/README.md) — how role assignments are provisioned and revoked.

## Files

- [sequence.md](./sequence.md) — request-time role/permission resolution with hierarchy and SoD alternates.
- [swimlane.md](./swimlane.md) — lanes for User, PEP, RBAC store, resource.
- [flowchart.md](./flowchart.md) — permit/deny decision logic including hierarchy and SoD gates.
