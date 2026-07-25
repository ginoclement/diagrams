---
title: "OIDC Authorization Code Flow (Confidential Client) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Authorization Code Flow (Confidential Client) — Client Snippets

Runnable, copy-paste client snippets for the [Authorization Code flow](./README.md). Every
value below is **synthetic** — placeholders (`$CLIENT_ID`, `$CLIENT_SECRET`, `$AUTH_CODE`, …)
and fake host names. Substitute your own IdP endpoints and credentials before running.

```sh
# Shared environment (synthetic)
export IDP="https://idp.example.com"
export CLIENT_ID="s6BhdRkqt3"
export CLIENT_SECRET="cs_synthetic_9f8e7d6c5b4a3210"
export REDIRECT_URI="https://app.example.com/callback"
export API="https://api.example.com"
```

## 1. Discover the endpoints (`GET /.well-known/openid-configuration`)

```sh
curl -s "$IDP/.well-known/openid-configuration" | jq '{authorization_endpoint, token_endpoint, userinfo_endpoint, jwks_uri}'
```

## 2. Send the browser to `/authorize` (front channel)

This is a URL the client redirects the **browser** to — not a back-channel call. `state` and
`nonce` are freshly generated per request and stored in the session.

```sh
# Build the URL the browser is redirected to (302 from your app)
echo "$IDP/authorize?response_type=code\
&client_id=$CLIENT_ID\
&redirect_uri=$REDIRECT_URI\
&scope=openid%20profile%20email\
&state=af0ifjsldkj\
&nonce=n-0S6_WzA2Mj"
```

After the user authenticates and consents, the IdP redirects the browser back to:

```
https://app.example.com/callback?code=$AUTH_CODE&state=af0ifjsldkj
```

Verify `state` matches the value you stored before using the code.

## 3. Redeem the code at `/token` (back channel, `client_secret_basic`)

```sh
export AUTH_CODE="SplxlOBeZQQYbYS6WxSbIA"

curl -s -X POST "$IDP/token" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "redirect_uri=$REDIRECT_URI" | jq
```

Returns `access_token`, `id_token`, `token_type=Bearer`, `expires_in`, and (if `offline_access`
was requested) a `refresh_token`.

## 4. (Optional) Fetch profile from `/userinfo`

```sh
export ACCESS_TOKEN="at_synthetic_2f1e0d9c8b7a6543"

curl -s "$IDP/userinfo" -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## 5. Call the resource server

```sh
curl -s "$API/v1/reports" -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## SDK example (Node.js, `openid-client`)

`openid-client` is a widely used certified OIDC relying-party library.

```js
import { Issuer, generators } from 'openid-client';

const issuer = await Issuer.discover('https://idp.example.com');
const client = new issuer.Client({
  client_id: 's6BhdRkqt3',
  client_secret: 'cs_synthetic_9f8e7d6c5b4a3210', // synthetic
  redirect_uris: ['https://app.example.com/callback'],
  response_types: ['code'],
});

// Step 2: redirect the browser here
const state = generators.state();
const nonce = generators.nonce();
const authUrl = client.authorizationUrl({
  scope: 'openid profile email',
  state,
  nonce,
});
// res.redirect(authUrl)

// Step 3: in the /callback handler, exchange the code
const params = client.callbackParams(req); // { code, state }
const tokenSet = await client.callback(
  'https://app.example.com/callback',
  params,
  { state, nonce }, // library validates state + nonce for you
);

console.log(tokenSet.claims()); // decoded, signature-verified ID token claims
```

---

**All values in this file are synthetic.** The tokens, codes, and secrets are fake strings and
will not authenticate against any real system.
