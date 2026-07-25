---
title: "OIDC Implicit Flow — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
---

# OIDC Implicit Flow — Reading it in DevTools

> **⛔ Deprecated flow.** This walkthrough is for recognizing and auditing legacy implicit
> integrations. New work should use
> [Authorization Code + PKCE](../authorization-code-pkce/README.md). See [README](./README.md).

Open DevTools (F12 / Cmd+Opt+I), go to the **Network** tab, enable **Preserve log** (the
authorize response redirects — you need history), and filter per step.

## Step by step

1. **The SPA bounces you to the IdP.**
   - Filter: `authorize`
   - Request: `GET https://idp.example.com/authorize?response_type=id_token%20token&...&nonce=n-xyz-implicit-42`
   - Read the **Query String Parameters**: `response_type=id_token token` (the tell-tale
     sign of implicit), `state`, and the **required** `nonce`.

2. **The response returns tokens IN THE URL FRAGMENT.**
   - The `302` `Location` is
     `https://spa.example.com/callback#id_token=...&access_token=...&token_type=Bearer&expires_in=3600&state=...`.
   - **Critical:** everything after `#` is the fragment, which the browser does **NOT**
     send to the server. So on the callback request you will see **no** token data in the
     Network tab's request. The tokens are visible in the **address bar**, in the
     Network row's `Location` header, and via `location.hash` in the **Console** — which
     is exactly the leakage problem (history, referrer edge cases, any injected script can
     read `location.hash`).
   - Decode the `id_token` (jwt.io / Auth Inspector extension). Confirm `nonce` matches and
     an **`at_hash`** claim is present (it binds the access token). See
     [samples/README.md](./samples/README.md).

3. **The access token is used against the API.**
   - Filter: `resource`
   - Request: `GET https://api.example.com/resource` with `Authorization: Bearer <access_token>`.
   - Read: the bearer token in the **Request Headers** — note it is the same value that was
     sitting in the URL fragment. There is no sender constraint; anyone who read the
     fragment can replay this exact header.

4. **Silent renewal (no refresh token).**
   - Filter: `authorize` (again)
   - Request: a **hidden iframe** `GET .../authorize?...&prompt=none`.
   - Read the **Response**: under blocked third-party cookies you'll see the fragment carry
     `#error=login_required`, forcing a full interactive redirect. This is the renewal
     fragility that makes implicit hard to keep alive on modern browsers.

## What the capture demonstrates

- Tokens in the URL, no `/token` call, no client authentication: an attacker who obtains
  the fragment (history sync, injected script, leaked link) can replay the access token
  and the API cannot tell them apart from the real SPA. There is **no in-protocol
  mitigation** — migrate to code + PKCE.
