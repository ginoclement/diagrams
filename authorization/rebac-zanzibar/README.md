# Relationship-Based Access Control (ReBAC) — Google Zanzibar Model

**Status:** 🔵 Emerging

## What it is

ReBAC decides access from the **relationships** between subjects and objects rather than from roles
or standalone attributes. Google **Zanzibar** is the canonical implementation and the model behind
SpiceDB, OpenFGA, Ory Keto, and Auth0 FGA. Its building blocks:

- **Relation tuple** — the atomic fact, written `object#relation@user`, e.g.
  `document:readme#owner@user:anna`. It says *anna is an owner of document readme*.
- **Userset** — a set of users defined by a relation, e.g. `group:eng#member`; a tuple's "user" can
  itself be a userset (`document:readme#viewer@group:eng#member`), giving **groups-as-subjects**.
- **Namespace / schema** — per-object-type config declaring relations and **userset rewrites**:
  `viewer = viewer + editor` (editors are viewers), `viewer = viewer + parent->viewer` (inherit
  from a parent folder). This is how relationships compose transitively.
- **Check(object, relation, user)** — the authorization API: *is user related to object via
  relation?* Returns a boolean, walking the tuple graph and rewrites.
- **Expand(object, relation)** — returns the full userset tree for a relation (for debugging/UI).
- **Zookie / consistency token** — an opaque token encoding a snapshot timestamp. Callers pass the
  zookie from a write into later Checks to get **"new-enough"** consistency and avoid the "new
  enemy" problem (a stale ACL leaking content after a permission was revoked).

## When it is used

- Fine-grained, per-object authorization at scale: "who can view *this specific* document," nested
  folders, org/team/group hierarchies, sharing models (Google Docs, GitHub repos).
- When [RBAC](../rbac/README.md) role explosion and [ABAC](../abac/README.md) attribute plumbing
  cannot cleanly express **object graphs** and inheritance ("access flows down the folder tree").
- As a centralized authorization service queried by many microservices over Check.

## Actors and components

| Component | Role |
|---|---|
| Client / App (PEP) | Calls Check before acting; writes tuples when relationships change |
| Zanzibar service (PDP) | Stores tuples, evaluates Check/Expand against the schema |
| Namespace schema | Declares relations and userset-rewrite rules per object type |
| Relation tuple store | The source-of-truth ACL facts, versioned by timestamp |
| Zookie | Consistency token binding a Check to a minimum snapshot |
| Watch API | Streams tuple changes for cache invalidation / materialization |

## Alternate scenarios covered

- **Direct tuple** — user is directly `viewer` of the object.
- **Userset rewrite (computed)** — user is `editor`; schema says editors are viewers → Check passes.
- **Userset via group** — user is `group:eng#member` and the group is a `viewer`.
- **Tuple-to-userset (parent inheritance)** — object has a `parent` folder; viewer is inherited from
  `parent->viewer`, walking up the tree.
- **Consistency with a zookie** — a Check after a revoke uses the write's zookie so the revoke is
  visible (avoids the "new enemy" stale-read).

## Security notes

- **Consistency vs latency**: Zanzibar defaults to bounded-staleness for speed but supports
  **at-least-as-fresh** reads via zookies. Use a zookie after any permission-revoking write so the
  revoke cannot be bypassed by a stale replica — this is the core **"new enemy" problem**.
- The tuple store is the ACL source of truth; **writes must be authorized** too — anyone who can
  write `document:x#owner@user:self` has just granted themselves access. Guard the write path.
- **Deep or cyclic graphs**: userset rewrites and parent walks can fan out; cap recursion depth and
  detect cycles to bound Check cost and prevent denial-of-service via pathological graphs.
- Centralizing authorization creates a **critical dependency** — Check is on the hot path of every
  request. Plan for caching (with Watch-driven invalidation), replication, and graceful degradation.
- Model **Deny** carefully: classic Zanzibar is allow-only (no negative tuples); "deny" is the
  absence of a relation. If you need explicit deny/exclusion, use schema features like
  `viewer = viewer - banned` where supported, and reason about ordering.

## Related diagrams

- [RBAC](../rbac/README.md) — the model ReBAC supersedes when object graphs and inheritance dominate.
- [ABAC](../abac/README.md) — attribute conditions; some FGA systems combine ReBAC + ABAC.
- [Policy engine (OPA/Cedar)](../pbac-policy-engine/README.md) — Cedar supports relationship-style
  policies; an alternative mechanism.
- [Policy decision and enforcement](../policy-decision-enforcement/README.md) — Check is the PDP
  call in the generic pattern.

## Files

- [sequence.md](sequence.md) — Check happy path plus rewrite, group, parent-inheritance, and zookie alternates.
- [swimlane.md](swimlane.md) — lanes for App/PEP, Zanzibar service, tuple store, schema.
- [flowchart.md](flowchart.md) — Check evaluation walking direct tuples, rewrites, and parent usersets.
