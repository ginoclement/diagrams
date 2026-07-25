---
title: "Scopes, Claims, and Entitlements"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Scopes, Claims, and Entitlements

**Status:** ✅ Current

## What it is

Three authorization primitives that operate at **different layers** and are frequently confused:

- **OAuth scopes** are a **token-time, coarse** grant. A scope (e.g. `invoices.read`) names a
  *capability the client asked for and the user/admin consented to*. It bounds what the **client**
  may attempt on the user's behalf — it is a ceiling on delegated authority, not per-object
  permission. Scopes live in the access token (as a `scope` string or `scp`/`scopes` claim) and are
  fixed for the life of that token.
- **Claims** are **assertions about the subject or authorization context**, carried in the ID token
  (identity claims: `sub`, `email`, `name`) and/or the access token (authorization claims: `roles`,
  `groups`, `entitlements`, `tenant`, `acr`, `amr`). They are what the issuer *stated at token
  issuance*. A resource can read a claim without a network call, but the claim is only as fresh as
  the token.
- **Entitlements** are **fine-grained, runtime** authorization facts — "may user U perform action A
  on *this specific* resource R" — resolved **at the resource** against live policy/data (roles,
  relationships, attributes, ownership). They are not a token format; they are the decision an
  authorization model ([RBAC](../rbac/README.md), [ReBAC](../rebac-zanzibar/README.md), ABAC)
  produces per request.

The relationship is a funnel: **scope** gates *whether the client may even ask*; **claims** carry
*who the subject is and coarse authorization context*; **entitlement** decides *this exact
operation on this exact object, now*. A request must pass all three — scope check, then the
resource's own fine-grained authorization — because coarse token-time authority never implies
instance-level permission.

## When it is used

- Any OAuth2/OIDC-protected API: the gateway checks scope, the service checks entitlement.
- Multi-tenant SaaS where a token may carry `tenant` and `roles` claims but per-record access
  (owner, shared-with, project membership) is decided at the resource.
- Systems that must avoid **over-trusting the token**: broad scopes and stale role claims are common
  privilege-escalation paths, so the resource re-decides fine-grained access at runtime.

## Actors and components

| Component | Role |
|---|---|
| User | Resource owner who consents to the scopes the client requests |
| Client | App requesting an access token; bounded by granted scopes |
| IdP / Authorization Server | Issues ID/access tokens, stamps scopes and claims at issuance |
| API Gateway | Coarse gate: validates the token and checks required scope for the route |
| Resource / Service | Fine-grained gate: resolves the entitlement for subject + action + object |
| Policy / Data store | Live roles, relationships, attributes the entitlement decision reads |

## Alternate scenarios covered

- **Scope present but entitlement denied** — token has `invoices.write`, but the subject does not
  own or is not related to *this* invoice → resource denies even though the scope check passed.
- **Missing scope** — the gateway rejects at the coarse layer before the resource is ever reached.
- **Stale role claim** — a `roles` claim was true at issuance but revoked since; the resource
  re-checks live data rather than trusting the claim (freshness gap).
- **Claim too big for the token** — roles/entitlements overflow token size, so the token carries a
  reference and the resource fetches entitlements at runtime (claim thinning).
- **Step-up required** — the operation needs a higher `acr`/`amr` than the token asserts → challenge.

## Security notes

- **Scope is a ceiling, not a permission.** `invoices.write` means "the client may attempt writes",
  never "the user may write *this* invoice". Enforcing only scope is a classic broken-object-level
  authorization (BOLA/IDOR) flaw — always add the instance-level entitlement check at the resource.
- **Do not trust claims past their freshness.** Role/group/entitlement claims are point-in-time
  snapshots; a revocation is not effective until the token expires unless the resource consults live
  data or introspection. Keep access-token lifetimes short and re-decide sensitive actions.
- **Least-privilege scopes.** Request the narrowest scopes needed; broad "read/write everything"
  scopes make a leaked token maximally dangerous. Prefer incremental/step-up consent.
- **Separate identity from authorization.** ID-token claims describe *who*; do not use them for
  access decisions on protected resources — use the access token and, above all, the runtime
  entitlement. Never send the ID token to APIs as a bearer credential.
- **Validate the token fully** (issuer, audience, signature, expiry) before reading any claim; an
  unvalidated claim is attacker-controlled input.

## Related diagrams

- [Authorization Code](../../oidc/authorization-code/README.md) — how the token that carries scopes
  and claims is obtained.
- [RBAC](../rbac/README.md) — a role claim is the coarse layer; the role check often precedes the
  fine-grained entitlement.
- [ReBAC / Zanzibar](../rebac-zanzibar/README.md) — the per-object relationship model that resolves
  the runtime entitlement.

## Files

- [sequence.md](sequence.md) — token-time scope/claim issuance then runtime entitlement resolution, with deny alternates.
- [swimlane.md](swimlane.md) — lanes for User, Client, IdP, Gateway, Resource, Policy store.
- [flowchart.md](flowchart.md) — layered scope-then-entitlement decision with explicit deny terminals.
