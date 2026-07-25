---
title: "OIDC Implicit Flow — Sample Capture & Decoded Tokens"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
---

# OIDC Implicit Flow — Sample Capture & Decoded Tokens

> **⛔ Deprecated flow.** Kept for reference and migration only. Use
> [Authorization Code + PKCE](../../authorization-code-pkce/README.md). See [README](./README.md).

Sanitized artifacts for the OIDC Implicit Flow. All values are **synthetic**.

- HAR capture: [./implicit.har](./implicit.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

The defining trait: both tokens are delivered **in the URL fragment**, so they sit in
browser history and are readable by any script via `location.hash` — with no client
authentication. That is the weakness that deprecated the flow.

## The fragment response

```
https://spa.example.com/callback#id_token=eyJ...&access_token=SlAV32hkKG-synthetic&token_type=Bearer&expires_in=3600&state=abc
```

- `access_token=SlAV32hkKG-synthetic` — a **bearer** token, no sender constraint; whoever
  reads the fragment can replay it.
- `state=abc` — must match what the SPA stored.

## The `id_token` (carries `at_hash`)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDM2MDAsImlhdCI6MTc3NDAwMDAwMCwiYXV0aF90aW1lIjoxNzczOTk5OTAwLCJub25jZSI6Im4teHl6LWltcGxpY2l0LTQyIiwiYXRfaGFzaCI6Ing3dmszUWIybU45cEx3RXJUeVVpT0EifQ.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded header

```json
{ "alg": "RS256", "typ": "JWT", "kid": "idp-key-2026" }
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",   // issuer
  "sub": "248289761001",              // subject
  "aud": "s6BhdRkqt3",                // this SPA's client_id
  "exp": 1774003600,
  "iat": 1774000000,
  "auth_time": 1773999900,
  "nonce": "n-xyz-implicit-42",       // MUST match — the ONLY replay defense in implicit
  "at_hash": "x7vk3Qb2mN9pLwErTyUiOA" // base64url(left-half(SHA-256(access_token))) — binds the AT
}
```

> **Validate `nonce` and `at_hash`.** With no back-channel exchange, `nonce` is the only
> replay protection and `at_hash` is the only binding between the ID token and the access
> token issued alongside it. (The `at_hash` value shown is illustrative synthetic data,
> not the real hash of the sample access token.)

## Reading the HAR

- Entry 1 — `GET /authorize`: `302` whose `Location` **fragment** carries `id_token`,
  `access_token`, `token_type`, `expires_in`, `state`.
- Entry 2 — `GET /callback`: the SPA page loads; note the request carries **no** token data
  (the fragment never reached the server) — the SPA reads it from `location.hash`.
- Entry 3 — `GET /resource`: the fragment-derived access token replayed as a bearer header.

> Every value is a sanitized placeholder; the signature segment
> (`SIG_synthetic_not_a_real_signature_do_not_verify`) will not verify.
