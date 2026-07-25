---
title: "OIDC Authorization Code Flow with PKCE (Public Client) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7636"
---

# OIDC Authorization Code Flow with PKCE (Public Client) — Client Snippets

Runnable client snippets for the [Authorization Code + PKCE flow](./README.md). All values are
**synthetic** — placeholders (`$CLIENT_ID`, `$CODE_VERIFIER`, `$AUTH_CODE`, …) and fake hosts.
There is **no client secret**: PKCE replaces it for public clients.

```sh
# Shared environment (synthetic)
export IDP="https://idp.example.com"
export CLIENT_ID="spa-public-001"
export REDIRECT_URI="https://app.example.com/callback"
export API="https://api.example.com"
```

## 0. Generate the PKCE verifier and challenge (in the app, before /authorize)

```sh
# 43-128 chars of high-entropy unreserved characters, kept only in app memory
export CODE_VERIFIER="$(openssl rand -base64 60 | tr '+/' '-_' | tr -d '=\n')"

# code_challenge = BASE64URL( SHA256( code_verifier ) )
export CODE_CHALLENGE="$(printf '%s' "$CODE_VERIFIER" \
  | openssl dgst -binary -sha256 \
  | openssl base64 | tr '+/' '-_' | tr -d '=\n')"

echo "verifier:  $CODE_VERIFIER"
echo "challenge: $CODE_CHALLENGE"
```

## 1. Discover the endpoints

```sh
curl -s "$IDP/.well-known/openid-configuration" | jq '{authorization_endpoint, token_endpoint, jwks_uri}'
```

## 2. Send the browser to `/authorize` with the challenge (front channel)

```sh
echo "$IDP/authorize?response_type=code\
&client_id=$CLIENT_ID\
&redirect_uri=$REDIRECT_URI\
&scope=openid%20profile%20email\
&state=af0ifjsldkj\
&nonce=n-0S6_WzA2Mj\
&code_challenge=$CODE_CHALLENGE\
&code_challenge_method=S256"
```

The IdP redirects the browser back to:

```
https://app.example.com/callback?code=$AUTH_CODE&state=af0ifjsldkj
```

## 3. Redeem the code at `/token` with the verifier (no secret)

```sh
export AUTH_CODE="SplxlOBeZQQYbYS6WxSbIA"

curl -s -X POST "$IDP/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "redirect_uri=$REDIRECT_URI" \
  -d "client_id=$CLIENT_ID" \
  -d "code_verifier=$CODE_VERIFIER" | jq
```

The IdP recomputes `SHA256(code_verifier)` and rejects with `invalid_grant` on any mismatch — a
stolen code alone cannot be redeemed.

## 4. Call the resource server

```sh
export ACCESS_TOKEN="at_synthetic_2f1e0d9c8b7a6543"
curl -s "$API/v1/reports" -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## SDK example (browser SPA, `oidc-client-ts`)

`oidc-client-ts` is a popular certified relying-party library for SPAs; it generates and stores
the PKCE `code_verifier` for you.

```js
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const userManager = new UserManager({
  authority: 'https://idp.example.com',
  client_id: 'spa-public-001',              // public client, no secret
  redirect_uri: 'https://app.example.com/callback',
  response_type: 'code',                    // PKCE is applied automatically for code flow
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
});

// Step 2: kick off login (library creates code_verifier + code_challenge, stores state/nonce)
await userManager.signinRedirect();

// Step 3: back on /callback — library sends the code + code_verifier to /token and validates
const user = await userManager.signinRedirectCallback();
console.log(user.profile);       // decoded, verified ID-token claims
console.log(user.access_token);  // for calling the API
```

---

**All values in this file are synthetic.** Tokens, codes, verifiers, and challenges are fake and
authenticate against nothing.
