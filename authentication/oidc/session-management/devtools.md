---
title: "OpenID Connect Session Management 1.0 — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OpenID Connect Session Management 1.0 — Reading it in DevTools

Open DevTools (F12 / Cmd+Opt+I), go to the **Network** tab, enable **Preserve log**, and
filter per step. A crucial quirk of this flow: **the polling itself is not on the network.**
See [README](./README.md).

> **The poll loop is `postMessage`, not HTTP.** The RP iframe and OP `check_session_iframe`
> exchange `"<client_id> <session_state>"` / `"unchanged"|"changed"|"error"` via
> `window.postMessage`. That is **window messaging inside the browser, so it does NOT
> appear in the Network tab.** To watch it, log messages in the **Console** (or add a
> `window.addEventListener("message", ...)` breakpoint in **Sources**). Only the iframe
> *loads* and the `prompt=none` re-auth are real network requests.

## Step by step

1. **The OP check_session_iframe loads (browser-visible).**
   - Filter: `check_session`
   - Request: `GET https://idp.example.com/check_session`
   - Read: it loads as a hidden frame (`Sec-Fetch-Dest: iframe`). Its response sets/reads
     the OP browser-state cookie that the poll hashes against.

2. **The poll exchange (NOT visible in Network — use the Console).**
   - There is no HTTP request. In the Console you'd see the RP post
     `"s6BhdRkqt3 <session_state>"` and the OP reply `"unchanged"` (steady state),
     `"changed"` (OP session differs), or `"error"` (couldn't read browser-state, e.g.
     third-party cookies blocked).
   - `session_state` has the form `hash.salt`; the salt rotates each computation, so the
     value changes even when the session hasn't.

3. **On `"changed"`: silent re-authentication (browser-visible).**
   - Filter: `authorize`
   - Request: `GET https://idp.example.com/authorize?...&prompt=none&nonce=sm-reauth-9931`
   - Read the **Query String**: `prompt=none` (no UI), plus `state` and `nonce`.
   - Read the **Response Location**:
     - Success → `.../silent-cb?code=...&state=...` (user still logged in at the OP).
     - Failure → `.../silent-cb?error=login_required&state=...` (user logged out at the
       OP → the RP ends its local session).

4. **Token exchange on success (browser-visible).**
   - Filter: `token`
   - Request: `POST https://idp.example.com/token` with `grant_type=authorization_code`.
   - Read the **Response** JSON: a fresh `id_token` (decode it — see
     [samples/README.md](./samples/README.md)) and a **new `session_state`** the RP stores
     to resume polling. The Auth Inspector extension will decode the `id_token` inline.

## Degradation to watch for

- If the Console shows a persistent `"error"` reply, the OP iframe cannot read the
  browser-state cookie (third-party cookie blocking / storage partitioning). Detection is
  now unreliable — treat it as "session state unknown" and fall back to
  [Front-Channel](../front-channel-logout/README.md) or
  [Back-Channel Logout](../back-channel-logout/README.md).
