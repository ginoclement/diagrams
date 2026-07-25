---
title: "Magic Link (Passwordless Email Login) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Magic Link (Passwordless Email Login) — DevTools Walkthrough

How to watch the magic-link flow in the browser **Network** tab. All values are
**synthetic**. Enable **Preserve log** so the redirect chain survives navigation.

## Observable requests, in order

1. **`POST /auth/magic-link`** — the request-a-link call.
   - Request payload: `{"email":"alice@example.com"}` (only an email; no password).
   - Response is a generic `200` "check your email" — **identical** whether or not
     the account exists (enumeration protection). Nothing sensitive is returned to
     the browser here.

2. **The emailed link GET: `GET /auth/verify?token=...`** — happens when the user
   clicks the link in their inbox (possibly on a different device).
   - The **query string** carries `token=ml_SYNTHETIC_...`. In DevTools open the row
     and read **Payload / Query String Parameters** to see the token.
   - This GET renders a confirmation page and, by design, **does not consume** the
     token — so that mail scanners / link-preview bots that pre-fetch the URL cannot
     burn it.

3. **`POST /auth/verify`** — the confirmation submit.
   - This is where the token is consumed atomically and the session is set.
   - **Response Headers** show **`Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax`**
     — an ordinary server-side session, exactly like
     [session-cookie](../session-cookie/README.md). The redirect lands on `/dashboard`.

4. **Subsequent requests** carry **`Cookie: sid=...`** automatically — the magic link
   itself is gone; from here on it is a normal session cookie.

## Things to notice

- The token lives in a **URL** (step 2), so it can leak via browser history,
  `Referer`, and server logs — hence single-use + short TTL.
- Reusing the token (replay the step-3 POST) should **fail** — check for a `4xx`
  and no new `Set-Cookie`.
- The session appears on whichever device clicked the link, not necessarily the one
  that requested it.

## What to inspect where

| Signal | Where in DevTools |
|---|---|
| Requested email (no password) | Network → `POST /auth/magic-link` → Payload |
| The link token | Network → `GET /auth/verify` → Query String Parameters |
| Session `Set-Cookie` | Network → `POST /auth/verify` → Response Headers |
| Replayed `Cookie` | Network → any later row → Request Headers |

See [samples/README.md](./samples/README.md) for a captured HAR and the annotated
link/session.
