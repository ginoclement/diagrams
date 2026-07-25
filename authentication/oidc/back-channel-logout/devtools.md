---
title: "Back-Channel Logout — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Back-Channel Logout — Reading it in DevTools

Open your browser DevTools (F12 / Cmd+Opt+I), switch to the **Network** tab, enable
**Preserve log** so redirects survive navigation, and set the request filter as noted per
step. See [README](./README.md) for the protocol.

> **The most important thing to understand about this flow: its core step is invisible in
> the browser.** Back-Channel Logout delivers the `logout_token` **server-to-server** —
> the IdP POSTs directly to each RP's `backchannel_logout_uri`. That request never
> traverses the user agent, so it **will not appear in the Network tab**. To see it you
> must capture on the server (RP access logs, a reverse-proxy trace, or a tool like
> mitmproxy in front of the RP), not in DevTools.

## What you CAN see in the browser

1. **Logout trigger (browser-visible).** Whatever kicked off the logout — typically an
   [RP-Initiated Logout](../rp-initiated-logout/README.md) hitting the IdP
   `end_session_endpoint` — appears as a normal navigation.
   - Filter: `end_session`
   - Request: `GET https://idp.example.com/end_session?id_token_hint=...&post_logout_redirect_uri=...`
   - Read: the `id_token_hint` query param (decode at jwt.io / with the Auth Inspector
     extension to see `sub` and `sid`), and the `post_logout_redirect_uri`.

2. **Post-logout redirect (browser-visible).** The IdP returns a `302` back to the RP's
   registered `post_logout_redirect_uri`.
   - Filter: `loggedout`
   - Read: the `state` query param echoed back; confirm no token material is in the URL.

3. **Re-authentication prompt on the next visit (browser-visible).** After the
   back-channel POST has destroyed the RP session server-side, the user's next request to
   the RP carries a now-orphaned session cookie. The RP finds no session and bounces the
   browser to `/authorize`.
   - Filter: `authorize`
   - Read: the `Set-Cookie` clearing the old RP session; the fresh `/authorize` redirect.
     This is your only browser-side evidence that the back-channel logout actually landed.

## What you CANNOT see in the browser (server-side capture required)

4. **`logout_token` delivery — BACK-CHANNEL, not visible in DevTools.**
   - Request (captured on the RP, e.g. in access logs or a proxy):
     `POST https://rp1.example.com/backchannel-logout`
     with `Content-Type: application/x-www-form-urlencoded` and body
     `logout_token=<JWT>`.
   - Read on the server side: URL-decode the `logout_token` form field, then decode the
     JWT (header + payload). Confirm `iss`, `aud` = your `client_id`, `iat`/`exp` recent,
     the `events` claim contains
     `http://schemas.openid.net/event/backchannel-logout`, `sub`/`sid` present, and — a
     common gotcha — that **no `nonce` claim** is present (a `nonce` means someone tried
     to replay an ID token as a logout token; reject with `400`).
   - Response: `200 OK` with `Cache-Control: no-store` on success; `400` on validation
     failure.
   - A decoded, annotated copy of exactly this token is in
     [samples/README.md](./samples/README.md).

> **Tip:** the [samples/back-channel-logout.har](./samples/back-channel-logout.har)
> capture includes the back-channel POST entry (as it would be recorded server-side)
> alongside the browser-visible requests, so you can practice decoding without standing up
> a proxy.
