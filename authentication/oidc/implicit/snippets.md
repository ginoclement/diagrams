---
title: "OIDC Implicit Flow — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
---

# OIDC Implicit Flow — Client Snippets

> **⛔ Deprecated.** The Implicit flow is removed by OAuth 2.1 and disallowed by the OAuth
> 2.0 Security BCP. These snippets exist to help you **recognize and migrate** legacy
> integrations — do not build new clients on this. Replacement:
> [Authorization Code + PKCE](../authorization-code-pkce/README.md). See [README](./README.md).

## 1. The authorization request (tokens come straight back in the fragment)

```bash
# response_type=id_token token -> the IdP returns tokens in the redirect fragment.
# nonce is REQUIRED — it is the only replay defense here.
curl -i -G 'https://idp.example.com/authorize' \
  --data-urlencode 'response_type=id_token token' \
  --data-urlencode 'client_id=s6BhdRkqt3' \
  --data-urlencode 'redirect_uri=https://spa.example.com/callback' \
  --data-urlencode 'scope=openid profile' \
  --data-urlencode 'state=abc' \
  --data-urlencode 'nonce=n-xyz-implicit-42'
# Response (302) Location fragment:
#   https://spa.example.com/callback#id_token=eyJ...&access_token=SlAV32hkKG&token_type=Bearer&expires_in=3600&state=abc
```

## 2. There is NO /token call and NO client authentication

```bash
# Nothing to run here. Implicit skips the back-channel token exchange entirely — which is
# exactly why bearer tokens end up exposed in the URL fragment with no client auth.
```

## 3. Call the resource server with the fragment access token

```bash
curl -s 'https://api.example.com/resource' \
  -H 'Authorization: Bearer SlAV32hkKG-synthetic-access-token'
```

## SDK example (browser JS — parse fragment, validate, strip)

```js
// Legacy SPA callback handler. Migrate to code + PKCE; this is shown for maintenance only.
import { createRemoteJWKSet, jwtVerify } from "jose"; // or a browser JWKS lib

async function handleImplicitCallback(expectedState, expectedNonce) {
  const p = new URLSearchParams(location.hash.slice(1)); // fragment: after '#'
  const idToken = p.get("id_token");
  const accessToken = p.get("access_token");

  if (p.get("state") !== expectedState) throw new Error("state mismatch");

  const JWKS = createRemoteJWKSet(new URL("https://idp.example.com/jwks"));
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: "https://idp.example.com",
    audience: "s6BhdRkqt3",
  });
  if (payload.nonce !== expectedNonce) throw new Error("nonce mismatch");

  // at_hash binds the access token to the id_token — verify it:
  // at_hash = base64url(left-half(SHA-256(ASCII access_token)))
  // (compute with SubtleCrypto and compare to payload.at_hash)

  // Immediately strip the fragment so tokens don't linger in history / location.hash:
  history.replaceState(null, "", location.pathname + location.search);
  return { payload, accessToken };
}
```

> **Renewal has no refresh token:** implicit clients renew via a hidden
> `prompt=none` iframe, which breaks under third-party-cookie blocking (`login_required`).
> That fragility is one more reason to migrate.

> **All values here are synthetic.** The `client_id`, tokens, `nonce`, and `state` are
> sanitized placeholders; the signature segment is
> `SIG_synthetic_not_a_real_signature_do_not_verify`. Never paste a real token into these
> files — and note that tokens landing in a URL is precisely the weakness that killed this
> flow.
