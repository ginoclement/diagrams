# OAuth 2.0 Token Introspection (RFC 7662)

**Status:** ✅ Current

## What it is

Token introspection lets a protected resource (or any authorized party) ask the
authorization server whether a token is currently active and to retrieve its
metadata. The resource server POSTs the token to the introspection endpoint
(`POST /introspect`, `token=...&token_type_hint=access_token`) with its own
client credentials, and gets back a JSON document whose canonical field is
`active` (boolean). When `active` is `true`, the response may also carry `scope`,
`client_id`, `username`, `token_type`, `exp`, `iat`, `nbf`, `sub`, `aud`, `iss`,
`jti`, and — for sender-constrained tokens — a `cnf` claim.

This is the standard way to validate **reference (opaque) access tokens** whose
contents are not readable by the resource server, in contrast with self-contained
JWT access tokens that a resource server validates locally against the JWKS.

## When it is used

- Resource servers that are issued opaque/reference access tokens and need the AS
  to resolve them into claims and a live active/inactive verdict.
- Deployments that want **instant revocation** semantics: an introspection call
  reflects a revoked token immediately, whereas a self-contained JWT stays valid
  until `exp`.
- Gateways and PEPs that centralize validation rather than distribute JWKS and
  validation logic to every service.

## Actors

| Actor | Role |
|---|---|
| Client | Originally obtained the access token; not directly involved in introspection |
| API | Resource server / PEP that receives the bearer token and introspects it |
| IdP | Authorization server exposing `/introspect`, authenticating the caller |

## Alternate scenarios covered

- Active token → `active:true` with full metadata; API enforces `scope`/`aud`.
- Inactive token (expired, revoked, unknown, wrong audience) → `active:false` only,
  no other fields leaked.
- Caller not authorized to introspect → `401 invalid_client`.
- Caching the positive result until `exp` to avoid an introspection round-trip per request.
- Sender-constrained token: `cnf` (`x5t#S256` or `jkt`) returned so the API can bind-check.

## Security notes

- The introspection endpoint MUST authenticate the caller (client credentials,
  mTLS, or a bearer of sufficient privilege); an open endpoint is a token oracle.
- For an inactive token the response MUST be exactly `{"active":false}` — never echo
  claims of an inactive or foreign token.
- Guard against introspection as an oracle: rate-limit and authorize per resource.
- Cache positive results only up to the token `exp`; caching hides fresh revocations,
  so tune the TTL against your revocation SLA — see
  [Token Revocation](../token-revocation/README.md).
- If the AS returns a `cnf` claim, the API must additionally verify proof of possession
  ([DPoP](../dpop/README.md) or [mTLS-bound tokens](../mtls-bound-tokens/README.md)).

## Related diagrams

- [Token Revocation](../token-revocation/README.md) — the write side of the same lifecycle.
- [Client Credentials](../client-credentials/README.md) — how the API authenticates itself to `/introspect`.
- [Authorization Code](../authorization-code/README.md) — where the introspected token originated.
- [Scopes, Claims, Entitlements](../../authorization/scopes-claims-entitlements/README.md) — enforcing what introspection returns.
- [Policy Decision / Enforcement](../../authorization/policy-decision-enforcement/README.md) — the PEP that consumes the verdict.

## Files

- [sequence.md](sequence.md) — happy path plus inactive-token, unauthorized-caller, and caching alternates.
- [swimlane.md](swimlane.md) — lanes for Client, API, IdP.
- [flowchart.md](flowchart.md) — active/enforcement decision logic with error terminals.
