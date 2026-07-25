---
title: "DPoP — Demonstrating Proof of Possession (RFC 9449)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9449"
---

# DPoP — Demonstrating Proof of Possession (RFC 9449)

**Status:** 🔵 Emerging

## What it is

DPoP sender-constrains OAuth tokens using an application-level proof instead of
mTLS. The client generates a public/private key pair and, on every request, sends
a `DPoP` header containing a signed proof JWT. The proof's header carries the
public key as a `jwk` and `typ:dpop+jwt`; its payload carries `htm` (HTTP method),
`htu` (HTTP URI), `iat`, and a unique `jti`, plus `ath` (a hash of the access
token) when calling a resource.

At the token endpoint the AS binds the issued access token to the key by embedding
`cnf: { "jkt": <SHA-256 thumbprint of the JWK> }`. Thereafter the resource server
accepts the token only when accompanied by a fresh DPoP proof signed by the
matching key — a stolen bearer token alone is useless. DPoP access tokens are
presented as `Authorization: DPoP <token>` (not `Bearer`).

## When it is used

- Public clients (SPAs, native apps) that cannot do mTLS but need
  sender-constrained tokens.
- Any deployment wanting stolen-token resistance without PKI plumbing.
- A FAPI 2.0 sender-constraining option alongside
  [mTLS-bound tokens](../mtls-bound-tokens/README.md).

## Actors

| Actor | Role |
|---|---|
| User | Authenticates during the underlying authorization flow |
| App | Public client holding the DPoP private key, signing a proof per request |
| IdP | AS that issues `jkt`-bound tokens and may require a `dpop_jkt` nonce |
| API | Resource server that verifies the proof and the `cnf`/`ath` binding |

## Alternate scenarios covered

- Happy path: proof at `/token` → `jkt`-bound access token → proof + `ath` at the API.
- Server-provided `DPoP-Nonce` (`401`/`400` with `use_dpop_nonce`) → client retries with nonce.
- Stolen access token replayed without a valid proof → API rejects `invalid_token`.
- Replayed proof (same `jti`) → rejected.
- Refresh-token binding for public clients (`jkt` carried across refresh).

## Security notes

- The proof binds to method + URI (`htm`/`htu`) and, at the API, to the token
  (`ath`); a proof captured for one call cannot be reused elsewhere.
- Enforce `jti` uniqueness and a tight `iat` window to stop proof replay; a
  server `DPoP-Nonce` closes the pre-generated-proof gap.
- The private key must stay in the client (WebCrypto non-extractable key, secure
  enclave); losing it to XSS defeats the binding.
- DPoP-bound tokens use the `DPoP` auth scheme; a resource server must not accept a
  `jkt`-bound token as a plain `Bearer`.
- Rotate the DPoP key per session; bind refresh tokens so a stolen refresh token is
  also useless — see [Refresh Token](../refresh-token/README.md).

## Related diagrams

- [mTLS-Bound Tokens](../mtls-bound-tokens/README.md) — the PKI-based alternative for sender-constraining.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the base public-client flow DPoP hardens.
- [Refresh Token](../refresh-token/README.md) — binding refresh tokens to the DPoP key.
- [Token Introspection](../token-introspection/README.md) — `cnf.jkt` returned so an API can bind-check opaque tokens.
- [Pushed Authorization Requests](../pushed-authorization-requests/README.md) — companion FAPI 2.0 building block.

## Files

- [sequence.md](sequence.md) — proof at token and resource endpoints, nonce challenge, and replay rejections.
- [swimlane.md](swimlane.md) — lanes for User, App, IdP, API.
- [flowchart.md](flowchart.md) — proof verification and binding decisions with error terminals.
