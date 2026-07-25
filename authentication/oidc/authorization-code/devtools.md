---
title: "OIDC Authorization Code Flow (Confidential Client) — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Authorization Code Flow (Confidential Client) — Reading it in DevTools

How to watch the [Authorization Code flow](./README.md) unfold in your browser's Network tab.
Remember the defining property of this flow: **tokens never transit the browser**. You can see
the front-channel redirects, but the code-for-token exchange happens server-to-server and is
invisible here.

## Setup

1. Open DevTools (`F12` or `Cmd/Ctrl+Shift+I`) and select the **Network** tab.
2. Enable **Preserve log** — the flow spans several full-page redirects that would otherwise
   clear the log.
3. Set the request filter to **Doc** (the redirects are document navigations), and optionally
   type `authorize` or `callback` in the filter box.
4. Start the sign-in from your app.

## What you'll see, step by step

1. **Discovery (optional, may be cached or done server-side)**
   - Request: `GET https://idp.example.com/.well-known/openid-configuration`
   - Filter: `well-known`. Often issued by the backend, not the browser — may not appear.
   - Read: the `authorization_endpoint`, `token_endpoint`, and `jwks_uri` in the JSON response.

2. **Authorization request (front channel, visible)**
   - Request: `GET https://idp.example.com/authorize?...`
   - Filter: `authorize`. Click it, open the **Payload** / **Query String Parameters** view.
   - Read these query params:
     - `response_type=code` — confirms the code flow.
     - `client_id` — which relying party.
     - `redirect_uri` — where the code will be delivered (must be an exact registered match).
     - `scope=openid profile email` — `openid` makes it OIDC.
     - `state` — CSRF token; note it, you'll match it on the callback.
     - `nonce` — will reappear inside the ID token to stop replay.

3. **User authentication at the IdP (visible, IdP-specific)**
   - One or more requests to the IdP's login/consent pages (`/login`, `/consent`, MFA, …).
   - Read: the IdP sets a **session cookie** here (Application tab → Cookies for the IdP origin).
     Credentials in any login POST body are the user's password — do not capture or share these.

4. **Redirect back with the code (front channel, visible)**
   - Request: `GET https://app.example.com/callback?code=...&state=...`
   - Filter: `callback`. Look at **Query String Parameters**:
     - `code` — the single-use authorization code (short-lived; useless without client auth).
     - `state` — must equal the value from step 2, or the client rejects the response as CSRF.
   - The response is typically a `302` from your app to the logged-in page.

5. **Token exchange (BACK CHANNEL — not visible in the browser)**
   - `POST https://idp.example.com/token` happens **server-to-server** from your app backend.
     It carries the code + client secret and returns the tokens. **You will not see this
     request or the `access_token` / `id_token` in DevTools** — that is the security point of
     this flow. To inspect it, look at your backend logs or use the [curl in snippets.md](./snippets.md).

6. **Session established / API calls (may be visible)**
   - If the SPA/front end calls the API directly, you'll see `GET https://api.example.com/...`
     with an `Authorization: Bearer ...` header. In a classic server-rendered app the API calls
     are also back-channel and won't appear; you'll instead see your app's own session cookie.

## Decoding what you can see

- The **ID token is not in the browser** for this flow, so there's nothing to base64url-decode
  in the Network tab. If your front end receives an access token to call the API, copy the
  `Authorization` header value; if it's a JWT (three dot-separated parts) paste the middle
  segment into a base64url decoder (or run `echo <part> | base64 -d`) to read the claims. Never
  paste real tokens into third-party web decoders.
- The **Application** tab shows the IdP session cookie and your app's session cookie — useful
  for understanding SSO and logout.

The [Auth Inspector](https://chromewebstore.google.com/) type extensions can pretty-print OAuth
params, but the raw **Network → Query String Parameters** view already shows everything on the
front channel. A companion sanitized capture is in [samples/](./samples/README.md).
