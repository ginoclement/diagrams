# SCIM 2.0 Provisioning

## Purpose

**SCIM (System for Cross-domain Identity Management) 2.0** — RFC 7643 (schema) and RFC 7644
(protocol) — is the standard REST/JSON wire protocol that IdPs and IGA engines use to push
identity data into downstream applications. It is the "how" underneath the
[joiner](../joiner-onboarding/README.md), [mover](../mover-role-change/README.md), and
[leaver](../leaver-offboarding/README.md) flows: when IGA "provisions an app," it is almost
always making SCIM calls against that app's `/Users` and `/Groups` resource endpoints.

This diagram models the CRUD lifecycle of a user on the wire — create, replace, partial
update, and delete — plus the real-world error and edge cases that any production SCIM
client must handle: create conflicts, group-membership patches, soft-delete via
`active=false`, and rate limiting.

## When it's used

- Any time an IdP/IGA (the SCIM **client**) synchronizes accounts to an application (the
  SCIM **service provider**) that exposes a SCIM 2.0 endpoint.
- Underlies most modern SaaS provisioning integrations (Okta, Entra ID, OneLogin,
  SailPoint all speak SCIM to app connectors).

## Actors

| Actor | Role |
|---|---|
| `IdP` | SCIM **client** (provisioning source) — IdP or IGA engine |
| `SP` | SCIM **service provider** — the downstream app exposing `/Users`, `/Groups` |
| `Store` | The SP's backing identity store / database |

## SCIM verbs and endpoints

| Operation | HTTP | Endpoint | Meaning |
|---|---|---|---|
| Create user | `POST` | `/Users` | Create a new user; returns `201` + resource + `id` |
| Read user | `GET` | `/Users/{id}` | Fetch a user; `/Users?filter=` to search |
| Replace user | `PUT` | `/Users/{id}` | Full replacement of the resource |
| Update user | `PATCH` | `/Users/{id}` | Partial update (add/replace/remove ops) |
| Delete user | `DELETE` | `/Users/{id}` | Remove the user (often mapped to soft-delete) |
| Group membership | `PATCH` | `/Groups/{id}` | Add/remove members without rewriting the group |

## Alternate scenarios covered

- **`409 Conflict` on create** — a user with the same `userName` / `externalId` already
  exists; the client reconciles by `GET`-ing and switching to `PATCH`/`PUT`.
- **`PATCH` group membership** — add or remove a single member with a targeted `Operations`
  patch instead of replacing the whole `members` array.
- **Soft-delete via `active=false`** — deactivate rather than `DELETE`, preserving the
  record (common for leavers under retention).
- **Rate limiting / `429`** — the SP returns `429 Too Many Requests` with `Retry-After`;
  the client backs off and retries.

## Alternate & related flows

- [joiner-onboarding](../joiner-onboarding/README.md) — uses `POST /Users` to create accounts.
- [mover-role-change](../mover-role-change/README.md) — uses `PATCH /Groups` to add/remove entitlements.
- [leaver-offboarding](../leaver-offboarding/README.md) — uses `DELETE` or `active=false` to deprovision.
- [jml-orchestration](../jml-orchestration/README.md) — the lifecycle these SCIM calls implement.

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — SCIM request/response exchange
- [swimlane.md](swimlane.md) — client / service-provider / store lanes
- [flowchart.md](flowchart.md) — server-side request-handling decision logic
