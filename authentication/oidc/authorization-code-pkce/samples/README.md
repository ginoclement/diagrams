---
title: "OIDC Authorization Code Flow with PKCE (Public Client) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7636"
---

# OIDC Authorization Code Flow with PKCE (Public Client) — Sample Capture

A sanitized HAR capture for the [Authorization Code + PKCE flow](../README.md).

- Capture file: [`./authorization-code-pkce.har`](./authorization-code-pkce.har)

The HAR has four entries: discovery, the `/authorize` redirect (carrying `code_challenge`), the
`/callback` redirect, and the SPA's `/token` call (carrying `code_verifier`). For PKCE public
clients the `/token` call runs in the browser, so **all four entries reflect real browser
traffic**.

## The PKCE pair

- `code_verifier` (sent at `/token`): `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` (synthetic)
- `code_challenge` (sent at `/authorize`): `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`
- Relationship: `code_challenge = BASE64URL( SHA256( code_verifier ) )`, method `S256`.

The IdP recomputes the hash of the presented verifier and compares it to the challenge it stored
from `/authorize`; a mismatch returns `invalid_grant`.

## Decoded ID token

The `id_token` from the `/token` response is a JWT (`header.payload.signature`). Decoded:

### Header (annotated)

```jsonc
{
  "alg": "RS256",             // signature algorithm; verify against the IdP JWKS
  "typ": "JWT",               // token type
  "kid": "idp-2026-07-key1"   // key id selecting the JWKS public key
}
```

### Payload / claims (annotated)

```jsonc
{
  "iss": "https://idp.example.com",   // issuer — MUST equal the configured IdP
  "sub": "248289761001",              // stable opaque user id
  "aud": "spa-public-001",            // audience — MUST equal this public client_id
  "exp": 1774000000,                  // expiry (Unix seconds)
  "iat": 1773996400,                  // issued-at
  "auth_time": 1773996390,            // when the user authenticated
  "nonce": "n-0S6_WzA2Mj",            // MUST equal the nonce sent to /authorize (anti-replay)
  "name": "Ada Lovelace",             // profile claim (synthetic)
  "email": "ada.lovelace@example.com",// profile claim (synthetic)
  "email_verified": true              // address verified by the IdP
}
```

PKCE protects the *code*, not the token: `state`, `nonce`, `iss`, `aud`, and `exp` must still be
validated exactly as in the base code flow.

---

**Everything here is synthetic.** User, tokens, code, verifier, challenge, and signature are all
fake.
