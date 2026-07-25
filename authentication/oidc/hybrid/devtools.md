---
title: "OIDC Hybrid Flow — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Hybrid Flow — Reading it in DevTools

Open DevTools (F12 / Cmd+Opt+I), go to the **Network** tab, enable **Preserve log** (the
authorize redirect navigates away — you need history), and filter per step. See
[README](./README.md).

## Step by step

1. **App bounces you to the IdP.**
   - Filter: `authorize`
   - Request: `GET https://idp.example.com/authorize?response_type=code%20id_token&...&nonce=n-xyz-hybrid-77`
   - Read the **Query String Parameters**: `response_type=code id_token`, `state`, and —
     mandatory for hybrid — `nonce`. If `response_mode=form_post`, note it here.

2. **The authorization response delivers code + front-channel ID token.**
   - **If default (fragment) response mode:** the `302` `Location` is
     `https://rp.example.com/cb#code=...&id_token=...&state=...`. The fragment
     (everything after `#`) is **NOT sent to the server**, so it won't appear as request
     data on the callback — read it from the **browser address bar** or via
     `location.hash` in the Console. Note the ID token transits the front channel here
     (same history/leakage caution as [implicit](../implicit/README.md), though no access
     token is exposed).
   - **If `response_mode=form_post`:** filter `cb`; you'll see a
     `POST https://rp.example.com/cb` whose **Form Data** contains `code`, `id_token`, and
     `state` — much easier to read in the Network tab.
   - Decode the `id_token` (jwt.io or the Auth Inspector extension). Confirm:
     - `nonce` equals what you sent (`n-xyz-hybrid-77`);
     - a **`c_hash`** claim is present — this binds the code to this response.

3. **Redeem the code — BACK-CHANNEL `/token`, server-to-server. Not visible in the browser.**
   - The RP back end POSTs the code to `https://idp.example.com/token`. This is a
     server-to-server call from the RP, so it does **not** appear in the browser Network
     tab. Capture it on the RP if you need to see it.
   - It returns a **second** `id_token`; the RP checks its `iss`/`sub` match the
     front-channel token.

4. **Resource call (visible only if the browser makes it).**
   - Filter: `resource`
   - Request: `GET https://api.example.com/resource` with `Authorization: Bearer ...`.
     If the RP calls the API server-side, this too is off-browser.

## Verifying `c_hash` from the capture

- Take the `code` from step 2 and compute
  `base64url(left-half(SHA-256(code)))`; it must equal the `c_hash` claim. A mismatch
  means the code was injected/substituted — the RP must reject and **never** redeem it.
  The [samples/README.md](./samples/README.md) shows the decoded tokens and the `c_hash`
  relationship; [samples/hybrid.har](./samples/hybrid.har) provides a form_post capture
  you can practice on.
