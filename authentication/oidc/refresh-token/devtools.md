---
title: "OAuth 2.0 / OIDC Refresh Token Grant — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 / OIDC Refresh Token Grant — Reading it in DevTools

Whether you can watch a refresh in the Network tab depends on the client type:

- **Public client (SPA)**: the refresh `POST /token` runs **in the browser** — fully visible in
  DevTools, request body and response.
- **Confidential client / backend-for-frontend**: the refresh is a **back-channel**
  server-to-server call and does **not** appear in the browser. Inspect it via backend logs or a
  proxy. In that setup the browser only ever sees your app's own session cookie.

The steps below assume the SPA case; where it differs for confidential clients it is noted.

## Setup

1. Open DevTools → **Network** tab.
2. Enable **Preserve log** (a refresh often fires around navigations or on a timer).
3. Filter: **Fetch/XHR**, and type `token` in the filter box.

## The requests, in order

1. **Refresh request (SPA: browser-visible; confidential: back channel)**
   - Request: `POST https://idp.example.com/token`
   - Open **Payload** (form body):
     - `grant_type=refresh_token`
     - `refresh_token=<the stored token>`
     - `client_id` (public client) — confidential clients instead send an
       `Authorization: Basic ...` header or a `client_assertion` you'd see on the back channel.
     - optionally `scope` to **narrow** the new access token.
   - Open the **Response** JSON:
     - `access_token` — the fresh token.
     - `expires_in` — new lifetime.
     - `id_token` — usually re-issued; decode it (below).
     - `refresh_token` — **with rotation this is a NEW value.** Confirm it differs from the one you
       sent; the client must now store the new one and discard the old.

2. **Subsequent API call (browser-visible if the SPA calls the API)**
   - Request: `GET https://api.example.com/...`
   - Header: `Authorization: Bearer <new access_token>`. Confirm the new token is used.

3. **Reuse detection (error path worth recognizing)**
   - If an **old, already-rotated** refresh token is replayed, `POST /token` returns HTTP `400`
     with `{"error":"invalid_grant", ...}`. In the Network tab this shows as a red `400` on the
     `token` request. The AS also revokes the whole family, so the *next* refresh — even with the
     "current" token — will also fail and force interactive re-authentication.

## Decoding the re-issued ID token

The `id_token` in the refresh response is a JWT (`header.payload.signature`). Decode the payload
locally:

```sh
echo '<payload-part>' | tr '_-' '/+' | base64 -d 2>/dev/null
```

Compare `exp`/`iat` against the previous token to confirm it was re-issued; `auth_time` stays at
the *original* interactive login (a refresh does not re-authenticate the user). Do not paste real
tokens into online decoders.

A sanitized capture (rotation success plus a reuse-detection failure) is in
[samples/](./samples/README.md).
