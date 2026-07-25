---
title: "OAuth 2.0 Token Revocation (RFC 7009)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7009"
---

# OAuth 2.0 Token Revocation (RFC 7009)

**Status:** ✅ Current

## What it is

Token revocation lets a client tell the authorization server to invalidate a token
it holds. The client POSTs to the revocation endpoint
(`POST /revoke`, `token=...&token_type_hint=refresh_token`) authenticating with its
own credentials. On success the AS returns `200` with an empty body — and per
RFC 7009 it returns `200` even if the token was already invalid or unknown, so the
client cannot use the endpoint to probe token validity.

Revoking a **refresh token** typically invalidates the associated access tokens as
well (and, for rotation deployments, the whole token family). Revoking an
**access token** invalidates just that token; whether resource servers see the
effect immediately depends on whether they validate via
[introspection](../token-introspection/README.md) (immediate) or by locally
validating a self-contained JWT (valid until `exp`).

## When it is used

- User-initiated "sign out everywhere" / app disconnect.
- A client discards long-lived credentials at logout or on account switch.
- Cleanup after suspected compromise, password change, or a leaver event.
- Companion to rotation and reuse detection in the
  [Refresh Token](../refresh-token/README.md) flow.

## Actors

| Actor | Role |
|---|---|
| User | Triggers logout / disconnect (optional; clients may revoke autonomously) |
| Client | Holds the token and calls `/revoke` with client authentication |
| IdP | Authorization server exposing `/revoke`, cascading the revocation |
| API | Resource server that stops honoring the token (immediately if introspecting) |

## Alternate scenarios covered

- Revoke a refresh token → cascade to its access tokens / family.
- Revoke an access token only.
- Already-invalid or unknown token → still `200` (no oracle).
- `token_type_hint` mismatch → server falls back to searching other token types.
- Unsupported token type → `400 unsupported_token_type`.
- Bad client authentication → `401 invalid_client`.

## Security notes

- The `200`-on-unknown behavior is deliberate: the endpoint must not become a
  validity oracle. Do not special-case unknown tokens.
- Revoking a refresh token SHOULD revoke dependent access tokens; document the blast radius.
- Self-contained JWT access tokens survive until `exp` regardless of revocation —
  pair short access-token lifetimes with revocation, or use introspection for
  instant effect.
- Only the client the token was issued to (or an authorized party) may revoke it;
  the AS MUST verify ownership.
- Wire revocation into logout and lifecycle events, not just explicit user action —
  see [Back-Channel Logout](../back-channel-logout/README.md).

## Related diagrams

- [Token Introspection](../token-introspection/README.md) — how a revoked token becomes visibly inactive.
- [Refresh Token](../refresh-token/README.md) — rotation, families, and reuse detection that revocation ties into.
- [RP-Initiated Logout](../rp-initiated-logout/README.md) — user-driven session teardown that should revoke tokens.
- [Back-Channel Logout](../back-channel-logout/README.md) — server-to-server teardown across RPs.

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Files

- [sequence.md](./sequence.md) — refresh-token revocation with cascade, plus access-token, unknown-token, and error alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Client, IdP, API.
- [flowchart.md](./flowchart.md) — token-type and ownership decisions with error terminals.
