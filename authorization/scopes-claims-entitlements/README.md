# Scopes vs Claims vs Entitlements

**Status:** ✅ Current

## What it is

Three overlapping-but-distinct authorization concepts that are constantly conflated:

- **OAuth scopes** — coarse, **delegation** grants. A scope (`invoices.read`, `mail.send`) names a
  *category* of access the resource owner consented to give the **client**. Scopes ride in the
  **access token** and answer "what is this *application* allowed to attempt on the user's behalf?"
  They are checked at the API boundary and are static for the token's lifetime.
- **ID-token / access-token claims** — assertions about the **subject** (and token): `sub`, groups,
  roles, `email`, `department`, plus protocol claims (`iss`, `aud`, `exp`, `scope`). ID-token claims
  are for the **client** to learn who the user is; access-token claims (e.g. `roles`, `groups`) can
  carry coarse authorization data the API reads. Claims answer "who is the user and what
  attributes/roles do they carry?"
- **Entitlements** — **fine-grained**, per-object rights evaluated at **runtime**: "can user U
  approve *invoice 42*?" These are too numerous and too volatile to embed in a token; they live in
  an authorization service ([RBAC](../rbac/README.md)/[ABAC](../abac/README.md)/[ReBAC](../rebac-zanzibar/README.md))
  and are checked per request against current data.

The key relationship: **scopes/claims are coarse, token-time authZ set at issuance; entitlements are
fine-grained, runtime authZ.** A scope says the app *may attempt* an operation; an entitlement check
decides whether *this user* may do it to *this object* right now. You need both — a valid scope with
no entitlement is still a deny.

## When it is used

- Every OAuth/OIDC-protected API: the gateway checks scope + audience (coarse), the service checks
  entitlements (fine). See [policy-decision-enforcement](../policy-decision-enforcement/README.md).
- Deciding **what to put in the token** vs **what to evaluate at runtime** — the central design
  question this diagram answers. Putting entitlements in tokens causes bloat and staleness.

## Actors and components

| Component | Role |
|---|---|
| User | Resource owner who consents to scopes and whose claims describe them |
| Client / App | Requests scopes, receives tokens, calls the API |
| IdP / Authorization Server | Issues access tokens (scopes) and ID tokens (claims) |
| API Gateway | Coarse check: validate token, audience, required scope |
| Resource service | Fine check: evaluate entitlement for this subject + object |
| Authorization service | Source of fine-grained entitlements (roles, relationships, policy) |

## Alternate scenarios covered

- **Valid scope, missing entitlement** — token permits the *operation class*, but the user lacks
  rights to the specific object → 403 at the service even though the gateway passed.
- **Claim-based coarse authZ** — a `roles`/`groups` claim gates an endpoint without a runtime lookup.
- **Scope present but wrong audience** — token was minted for another API → reject.
- **Token bloat avoided** — entitlements deliberately *not* in the token; looked up at runtime instead.

## Security notes

- **Scope is not permission**: a scope authorizes the *client* to attempt a class of calls; it never
  proves the *user* may touch a specific record. Always pair scope checks with entitlement checks.
- **Do not stuff entitlements into tokens**: per-object grants make tokens huge and, worse, **stale**
  — a revoked entitlement stays valid until the token expires. Keep fine-grained decisions at
  runtime where revocation is immediate.
- **Validate audience (`aud`) and issuer (`iss`)** before trusting any scope/claim — a token for a
  different API must be rejected (confused-deputy prevention).
- Treat **claims as inputs, not verdicts**: a `groups` claim is an attribute; the authorization
  decision still belongs to your policy, especially for anything beyond coarse gating.
- Prefer **narrow scopes** and least privilege; broad scopes (`api.full_access`) turn a stolen token
  into total compromise. See [incremental consent](../oauth-consent-authorization/README.md).

## Related diagrams

- [OAuth consent](../oauth-consent-authorization/README.md) — how the user grants the scopes in the first place.
- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — how scopes/claims land in tokens.
- [RBAC](../rbac/README.md) / [ABAC](../abac/README.md) / [ReBAC](../rebac-zanzibar/README.md) — where
  entitlements are actually computed.
- [Policy decision and enforcement](../policy-decision-enforcement/README.md) — coarse-at-gateway,
  fine-at-service in one picture.

## Files

- [sequence.md](sequence.md) — token issuance, coarse gateway check, fine entitlement check, and the mismatch alternates.
- [swimlane.md](swimlane.md) — lanes for User, Client, IdP, Gateway, Service, Authorization service.
- [flowchart.md](flowchart.md) — the two-layer decision: scope/audience gate then entitlement gate.
