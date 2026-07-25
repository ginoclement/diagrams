---
title: "OIDC Authorization Code Flow with PKCE (Public Client) — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7636"
---

# OIDC Authorization Code Flow with PKCE (Public Client) — Reading it in DevTools

How to watch the [Authorization Code + PKCE flow](./README.md) in the Network tab. Unlike the
confidential code flow, the `/token` call here is made **by the SPA itself in the browser** — so
you *can* see the token response, including the `code_verifier` going up and the tokens coming
back. Treat any tokens you see as sensitive even though these samples are fake.

## Setup

1. Open DevTools → **Network** tab.
2. Enable **Preserve log** (the flow includes full-page redirects).
3. Filter: start with **Doc** for the redirects, then switch to **Fetch/XHR** to catch the SPA's
   `/token` call. Type `authorize`, `callback`, or `token` in the filter box as needed.

## What you'll see, step by step

1. **Discovery (optional)**
   - Request: `GET https://idp.example.com/.well-known/openid-configuration`
   - Filter: `well-known`. Read `authorization_endpoint`, `token_endpoint`, `jwks_uri`.

2. **Authorization request (front channel, visible)**
   - Request: `GET https://idp.example.com/authorize?...`
   - Filter: `authorize` (a **Doc** request). Open **Query String Parameters**:
     - `response_type=code`, `client_id`, `redirect_uri`, `scope=openid ...`
     - `state`, `nonce` — as in the base flow.
     - `code_challenge` — the base64url SHA-256 of the verifier. **This is the PKCE fingerprint.**
     - `code_challenge_method=S256` — must be `S256`, not `plain`.
   - You cannot recover the `code_verifier` from the challenge — that is the whole point.

3. **User authentication at the IdP (visible, IdP-specific)**
   - Login/consent requests; the IdP sets a session cookie. Do not capture password POST bodies.

4. **Redirect back with the code (front channel, visible)**
   - Request: `GET https://app.example.com/callback?code=...&state=...`
   - Filter: `callback`. Read `code` and `state` (must match step 2's `state`).

5. **Token exchange (VISIBLE here — SPA runs it in the browser)**
   - Request: `POST https://idp.example.com/token`
   - Filter: switch to **Fetch/XHR**, type `token`. Open **Payload** (form body):
     - `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`
     - `code_verifier` — the original secret the SPA held; the IdP hashes it and compares to the
       `code_challenge` from step 2. **No client secret is present** — confirm that.
   - Open the **Response**: `access_token`, `id_token`, `token_type`, `expires_in`, maybe
     `refresh_token`.

6. **API calls (visible)**
   - Request: `GET https://api.example.com/...` with `Authorization: Bearer <access_token>`.

## Decoding the ID token

The `id_token` in the step-5 response is a JWT (`header.payload.signature`). Copy it, split on
the dots, and base64url-decode the first two parts:

```sh
# base64url -> add padding, translate chars, decode
echo '<payload-part>' | tr '_-' '/+' | base64 -d 2>/dev/null
```

Read `iss`, `aud` (== your `client_id`), `exp`, and `nonce` (== the value from step 2). Do not
paste real tokens into online decoders — decode locally.

The raw **Network → Payload / Response** panes show everything; an OAuth-aware extension like
Auth Inspector can additionally flag a missing/weak `code_challenge_method`. A sanitized capture
is in [samples/](./samples/README.md).
