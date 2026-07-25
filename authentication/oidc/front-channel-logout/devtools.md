---
title: "Front-Channel Logout — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Front-Channel Logout — Reading it in DevTools

Open DevTools (F12 / Cmd+Opt+I), go to the **Network** tab, enable **Preserve log** (the
logout page navigates away, so you need the history retained), and filter as noted. Unlike
[Back-Channel Logout](../back-channel-logout/README.md), **every step of this flow is
browser-visible** — that is the whole point of the front channel. See [README](./README.md).

> **Tip:** the iframe requests are same-navigation sub-resources. If you don't see them,
> confirm **Preserve log** is on and that the request-type filter isn't hiding
> Document/Other frames. The Auth Inspector extension groups the per-RP frames for you.

## Step by step

1. **The IdP logout page loads.**
   - Filter: `end_session`
   - Request: `GET https://idp.example.com/end_session?id_token_hint=...&post_logout_redirect_uri=...`
   - Read: the response HTML — its body contains one hidden `<iframe>` per RP. Look at the
     document response to see the `src` URLs the browser is about to fetch.

2. **Each RP's front-channel logout iframe fires.** One request per RP that joined the SSO
   session.
   - Filter: `frontchannel-logout`
   - Request: `GET https://rp1.example.com/frontchannel-logout?iss=https://idp.example.com&sid=abc123session`
     (and the same for `rp2.example.com`, etc.)
   - Read the **Query String Parameters**: `iss` (must equal the IdP issuer) and `sid`
     (must match the `sid` claim from that RP's ID token — see
     [samples/README.md](./samples/README.md) for the decoded source token).
   - Read the **Request Cookies**: whether the RP's own session cookie was actually sent.
     In a third-party-iframe context modern browsers often **partition or drop** it — if
     the cookie is absent, the RP cannot clear the session and you get a **partial logout**.
   - Read the **Response** `Set-Cookie`: on success the RP clears its session cookie
     (`Max-Age=0`). If there's no `Set-Cookie`, the frame loaded but nothing was cleared.

3. **Frames blocked by CSP / X-Frame-Options.** If an RP logout URI sends
   `X-Frame-Options: DENY` or a restrictive `Content-Security-Policy: frame-ancestors`,
   the browser refuses to render the frame.
   - Read: the **Console** tab for a "Refused to display in a frame" error, and the
     Network row will show the request blocked. The IdP gets **no signal** either way.

4. **Return to the RP (or IdP logged-out page).**
   - Filter: `loggedout`
   - Request: `GET https://rp1.example.com/loggedout` (via `post_logout_redirect_uri`).
   - Read: this fires regardless of whether the frames succeeded — a 200 here does **not**
     confirm every RP was logged out. Front-channel logout is best-effort with no
     acknowledgement channel.

## What to conclude from the capture

- Frame returned 200 **and** its request carried the RP session cookie **and** the
  response cleared it → that RP is logged out.
- Frame returned 200 but the **cookie was missing** (partitioned/blocked) → **partial
  logout**; that RP's session survives. This is the expected outcome on current browsers.
