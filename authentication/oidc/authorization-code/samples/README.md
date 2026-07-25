---
title: "OIDC Authorization Code Flow (Confidential Client) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Authorization Code Flow (Confidential Client) — Sample Capture

A sanitized HAR capture for the [Authorization Code flow](../README.md).

- Capture file: [`./authorization-code.har`](./authorization-code.har)

The HAR contains four entries: discovery, the `/authorize` redirect, the `/callback` redirect,
and the `/token` exchange. **The `/token` exchange is a back-channel server-to-server call and
does not appear in a real browser Network capture** — it is included here (as if captured via a
proxy) only so the ID token can be decoded below.

## Decoded ID token

The `id_token` from the `/token` response is a JWT: `header.payload.signature`, each part
base64url-encoded. Decode the first two parts (the signature is a fake string here):

```sh
# copy the token from the HAR, then:
echo <header-part>  | base64 -d   # after base64url -> base64 translation
echo <payload-part> | base64 -d
```

### Header (annotated)

```jsonc
{
  "alg": "RS256",             // signature algorithm; verify with the IdP's JWKS key
  "typ": "JWT",               // token type
  "kid": "idp-2026-07-key1"   // key id — selects which JWKS public key verifies the signature
}
```

### Payload / claims (annotated)

```jsonc
{
  "iss": "https://idp.example.com",   // issuer — MUST equal your configured IdP
  "sub": "248289761001",              // stable, opaque user id at this IdP
  "aud": "s6BhdRkqt3",                // audience — MUST equal your client_id
  "exp": 1774000000,                  // expiry (Unix seconds) — reject if past
  "iat": 1773996400,                  // issued-at
  "auth_time": 1773996390,            // when the user actually authenticated
  "nonce": "n-0S6_WzA2Mj",            // MUST equal the nonce you sent to /authorize (anti-replay)
  "name": "Ada Lovelace",             // profile claim (synthetic person)
  "email": "ada.lovelace@example.com",// profile claim (synthetic)
  "email_verified": true              // whether the IdP verified the address
}
```

Validation the client must perform: verify the signature against the JWKS key named by `kid`,
then check `iss`, `aud == client_id`, `exp` not passed, and `nonce` matches the stored value.

---

**Everything here is synthetic.** The user, tokens, code, cookies, and signature are all fake
and authenticate against nothing.
