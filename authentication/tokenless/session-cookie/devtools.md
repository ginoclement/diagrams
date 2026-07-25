---
title: "Session Cookie Authentication — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Session Cookie Authentication — DevTools Walkthrough

How to watch a session-cookie login in the browser **Network** tab (and the
**Application → Cookies** panel). All values shown are **synthetic**.

Open DevTools, enable **Preserve log**, and check **Fetch/XHR** + **Doc**.

## Observable requests, in order

1. **`GET /login`** — the login page.
   - Response header **`Set-Cookie: sid=PRE_AUTH_...; HttpOnly; Secure; SameSite=Lax`**.
   - Because it is `HttpOnly`, you will **not** see this cookie via `document.cookie`
     in the Console — only in the **Set-Cookie** response header and the
     **Application → Cookies** panel. That is the point: JavaScript cannot read it,
     which blunts XSS theft.

2. **`POST /login`** — credential submission.
   - Request payload carries `username`, `password`, `csrf_token`.
   - Response is a redirect (303/302) with a **new** `Set-Cookie: sid=...`.
   - Compare the `sid` value before and after: it **changes**. This session-ID
     rotation is the session-fixation defense — note the pre-auth `sid` is now dead.
   - Inspect the cookie attributes in the Set-Cookie header:
     - `HttpOnly` — not readable from JS.
     - `Secure` — only sent over HTTPS.
     - `SameSite=Lax` (or `Strict`) — limits cross-site sending; first-line CSRF defense.
     - `Max-Age` / `Expires` — the idle/absolute lifetime.

3. **`GET /api/me` (and every later request)** — the authenticated call.
   - In the **Request Headers** you now see **`Cookie: sid=...`** — the browser
     replays it automatically. This is the only thing proving who you are; the
     server looks the opaque `sid` up in its session store.
   - State-changing POSTs additionally carry the `csrf_token` (form field or
     `X-CSRF-Token` header) — verify it is present and matches the session.

4. **`POST /logout`** — teardown.
   - Response `Set-Cookie: sid=; Max-Age=0` clears the cookie; the server also
     deletes the store record, so replaying the old `sid` afterward fails.

## What to inspect where

| Signal | Where in DevTools |
|---|---|
| `Set-Cookie` on login (attributes) | Network → the `POST /login` row → Headers → Response Headers |
| `Cookie` replayed on requests | Network → any authenticated row → Headers → Request Headers |
| Live cookie + flags (HttpOnly/Secure/SameSite) | Application → Storage → Cookies → your origin |
| Session ID rotation | Compare `sid` value across the two `Set-Cookie` responses |

See [samples/README.md](./samples/README.md) for a captured HAR and the decoded
cookie attributes.
