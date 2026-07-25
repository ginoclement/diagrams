---
title: "OIDC Hybrid Flow — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Hybrid Flow — Client Snippets

Runnable snippets for the OIDC Hybrid Flow (`response_type=code id_token`). The
`/authorize` response returns **both** a code and a front-channel ID token (in the
fragment); the access token comes from the back-channel `/token` exchange. See
[README](./README.md).

## 1. The authorization request

```bash
# nonce is REQUIRED — the front-channel id_token must be replay-bound.
curl -i -G 'https://idp.example.com/authorize' \
  --data-urlencode 'response_type=code id_token' \
  --data-urlencode 'client_id=s6BhdRkqt3' \
  --data-urlencode 'redirect_uri=https://rp.example.com/cb' \
  --data-urlencode 'scope=openid email' \
  --data-urlencode 'state=abc' \
  --data-urlencode 'nonce=n-xyz-hybrid-77' \
  --data-urlencode 'response_mode=form_post'
# Response delivers: #code=SplxlOBe...&id_token=eyJ...&state=abc
# (fragment for default response_mode, or a form POST when response_mode=form_post)
```

## 2. Redeem the code at the token endpoint (back-channel)

```bash
# Confidential client authentication (HTTP Basic shown). This is server-to-server.
curl -s -X POST 'https://idp.example.com/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u 's6BhdRkqt3:SYNTHETIC-client-secret' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=SplxlOBeZQQYbYS6WxSbIA' \
  --data-urlencode 'redirect_uri=https://rp.example.com/cb'
# Response: access_token + a SECOND id_token whose iss/sub must match the front-channel one.
```

## 3. Call the resource server

```bash
curl -s 'https://api.example.com/resource' \
  -H 'Authorization: Bearer SlAV32hkKG-synthetic-access-token'
```

## Verifying `c_hash` (the point of hybrid)

```bash
# c_hash = base64url( left-most half of SHA-256(ASCII code) ), hash alg from the id_token alg.
CODE='SplxlOBeZQQYbYS6WxSbIA'
printf '%s' "$CODE" | openssl dgst -sha256 -binary \
  | head -c 16 | openssl base64 -A | tr '+/' '-_' | tr -d '='
# Compare the output to the c_hash claim in the front-channel id_token.
```

## SDK example (Node.js — validate front-channel token then c_hash)

```js
// npm i jose
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createHash } from "node:crypto";

const JWKS = createRemoteJWKSet(new URL("https://idp.example.com/jwks"));

async function handleHybridResponse({ code, id_token, state }, { expectedState, expectedNonce }) {
  if (state !== expectedState) throw new Error("state mismatch");

  // 1) Validate the front-channel id_token FULLY first...
  const { payload } = await jwtVerify(id_token, JWKS, {
    issuer: "https://idp.example.com",
    audience: "s6BhdRkqt3",
  });
  if (payload.nonce !== expectedNonce) throw new Error("nonce mismatch");

  // 2) ...THEN check c_hash binds this code to this response.
  const digest = createHash("sha256").update(code, "ascii").digest();
  const cHash = digest.subarray(0, digest.length / 2).toString("base64url");
  if (cHash !== payload.c_hash) throw new Error("c_hash mismatch — possible code injection");

  // Safe to render an immediate session; redeem `code` at /token for the access token,
  // then confirm the second id_token's iss & sub match `payload`.
  return payload;
}
```

> **All values here are synthetic.** The `code`, `nonce`, `client_secret`, tokens, and
> `c_hash` are sanitized placeholders; the signature segment is
> `SIG_synthetic_not_a_real_signature_do_not_verify`. Never paste a real client secret or
> token into these files.
