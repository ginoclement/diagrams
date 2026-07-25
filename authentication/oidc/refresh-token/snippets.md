---
title: "OAuth 2.0 / OIDC Refresh Token Grant — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 / OIDC Refresh Token Grant — Client Snippets

Runnable client snippets for the [Refresh Token grant](./README.md). All values are
**synthetic**. A public client sends `client_id`; a confidential client adds client
authentication. With **rotation**, each refresh returns a new refresh token and invalidates the
old one.

```sh
# Shared environment (synthetic)
export IDP="https://idp.example.com"
export CLIENT_ID="spa-public-001"
export API="https://api.example.com"
export REFRESH_TOKEN="rt_synthetic_A1_0000"
```

## 1. Refresh the access token — public client

```sh
curl -s -X POST "$IDP/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=$CLIENT_ID" | jq
```

Returns a fresh `access_token`, `expires_in`, a new `id_token`, and (with rotation) a **new
`refresh_token`** — replace your stored copy with it.

## 1b. Refresh — confidential client (`client_secret_basic`)

```sh
export CLIENT_SECRET="cs_synthetic_9f8e7d6c5b4a3210"

curl -s -X POST "$IDP/token" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN" | jq
```

## 1c. Refresh with a narrowed scope (never wider)

```sh
curl -s -X POST "$IDP/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=$CLIENT_ID" \
  -d "scope=openid" | jq
```

## 2. Reuse detection (what NOT to do)

Presenting an **already-rotated** refresh token trips reuse detection: the AS returns
`invalid_grant` and **revokes the entire token family** — both the thief and the legitimate
client are logged out and must re-authenticate.

```sh
# Replaying the OLD token after it was rotated:
curl -s -X POST "$IDP/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=$CLIENT_ID" | jq
# -> {"error":"invalid_grant","error_description":"Refresh token already used; family revoked"}
```

## 3. Use the fresh access token

```sh
export ACCESS_TOKEN="at_synthetic_new_99887766"
curl -s "$API/v1/reports" -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## SDK example (Node.js, `openid-client`)

`openid-client` returns a new `TokenSet` on refresh; persist the rotated `refresh_token`.

```js
import { Issuer } from 'openid-client';

const issuer = await Issuer.discover('https://idp.example.com');
const client = new issuer.Client({
  client_id: 'spa-public-001',
  token_endpoint_auth_method: 'none', // public client
});

// Exchange the stored refresh token for a fresh TokenSet
const tokenSet = await client.refresh('rt_synthetic_A1_0000'); // synthetic

console.log(tokenSet.access_token, tokenSet.expires_at);

// IMPORTANT: with rotation the response carries a NEW refresh token — store it,
// discard the old one, or the next refresh will trip reuse detection.
if (tokenSet.refresh_token) {
  saveRefreshToken(tokenSet.refresh_token); // your secure storage
}
```

---

**All values in this file are synthetic.** Refresh tokens, access tokens, and secrets are fake
strings and authenticate against nothing.
