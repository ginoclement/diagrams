---
title: "OAuth 2.0 / OIDC Refresh Token Grant — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 / OIDC Refresh Token Grant — Sample Capture

A sanitized capture for the [Refresh Token grant](../README.md).

- Capture file: [`./refresh-token.har`](./refresh-token.har)

The HAR has three entries: a successful **rotating** refresh at `/token`, a resource call with
the fresh access token, and a **reuse-detection failure** where the already-rotated token is
replayed and the whole family is revoked (`invalid_grant`). For a public client (SPA) these
`/token` calls are browser-visible; for a confidential client they are back-channel.

## Rotation, at a glance

- Refresh token **sent**: `rt_synthetic_A1_0000` (synthetic)
- Refresh token **returned**: `rt_synthetic_A2_0001` (synthetic) — the client must now store this
  and discard `...A1_0000`.
- Replaying `...A1_0000` after rotation → `{"error":"invalid_grant"}` and family revocation.

## Decoded re-issued ID token

The successful refresh returned a new `id_token` JWT (`header.payload.signature`).

### Header (annotated)

```jsonc
{
  "alg": "RS256",             // signature algorithm; verify via the IdP JWKS
  "typ": "JWT",               // token type
  "kid": "idp-2026-07-key1"   // key id selecting the JWKS public key
}
```

### Payload / claims (annotated)

```jsonc
{
  "iss": "https://idp.example.com",   // issuer — the authorization server
  "sub": "248289761001",              // stable opaque user id (unchanged across refreshes)
  "aud": "spa-public-001",            // audience — the client_id
  "exp": 1774010000,                  // NEW expiry — later than the previous token
  "iat": 1774006400,                  // NEW issued-at — the moment of this refresh
  "auth_time": 1773996390,            // UNCHANGED — the original interactive login, not "now"
  "name": "Ada Lovelace",             // profile claim (synthetic)
  "email": "ada.lovelace@example.com",// profile claim (synthetic)
  "email_verified": true              // address verified by the IdP
}
```

Key point: `iat`/`exp` move forward on each refresh, but `auth_time` stays pinned to the original
login — a refresh renews tokens, it does **not** re-authenticate the user. There is no `nonce`,
because a refresh has no front-channel `/authorize` request.

---

**Everything here is synthetic.** Refresh tokens, access tokens, and signature are all fake.
