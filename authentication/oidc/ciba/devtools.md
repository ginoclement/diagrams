---
title: "CIBA — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# CIBA — Reading it in DevTools

You would normally reach for DevTools (F12 / Cmd+Opt+I) → **Network** tab → **Preserve
log** → filter. For CIBA, that gets you almost nothing — and understanding *why* is the
point of this page. See [README](./README.md).

> **CIBA is a decoupled, back-channel flow: there is essentially nothing to see in a
> browser Network tab.** The consumption-device client talks to the IdP **server-to-server**
> (`POST /bc-authorize`, `POST /token`), and the user authenticates **out-of-band on their
> phone** (a push notification and an approval inside an authenticator app). None of those
> requests traverse a browser, so DevTools will not show them. To observe CIBA you capture
> on the **client back end** — application HTTP logs, or an egress proxy (mitmproxy,
> Charles) in front of the client — not in the browser.

## Where each step actually happens

1. **`POST /bc-authorize` — BACK-CHANNEL, server-to-server. Not visible in the browser.**
   - Capture on the client (proxy / server logs).
   - Read the request body: `scope=openid`, exactly one hint (`login_hint` /
     `login_hint_token` / `id_token_hint`), optional `binding_message`, `user_code`,
     `requested_expiry`, `client_notification_token` (ping/push), and client
     authentication (`client_assertion` for `private_key_jwt`, or mTLS).
   - Read the response JSON: `auth_req_id`, `expires_in`, `interval`.

2. **Push to the user's phone — OUT-OF-BAND. Not an HTTP request you can see at all.**
   - The IdP pushes a challenge to the registered authenticator; the user compares the
     `binding_message` (e.g. `PAY-4711`) shown on both the consumption device and the phone,
     then approves with biometric/PIN. This happens on the device vendor's push channel —
     invisible to both DevTools and your proxy.

3. **`POST /token` polling — BACK-CHANNEL, server-to-server. Not visible in the browser.**
   - Capture on the client. Each poll sends
     `grant_type=urn:openid:params:grant-type:ciba` and `auth_req_id`.
   - Read the responses: `400 authorization_pending` while waiting, `400 slow_down` if
     polling too fast, then `200` with `access_token` / `id_token` / `refresh_token` on
     approval. Terminal errors: `expired_token`, `access_denied`, `transaction_failed`.

4. **Ping/push callback (if used) — server-to-server to the CLIENT. Not in the browser.**
   - The IdP POSTs to the client's `client_notification_endpoint` with
     `Authorization: Bearer <client_notification_token>`. Capture this on the client's
     inbound side (webhook logs), not in DevTools.

## How to actually inspect it

- Point the client at an intercepting proxy and read the `/bc-authorize` and `/token`
  request/response pairs there. The provided
  [samples/ciba.har](./samples/ciba.har) is exactly such a server-side capture — load it
  into the Auth Inspector extension or any HAR viewer to decode the resulting `id_token`
  (also decoded in [samples/README.md](./samples/README.md)).
- The only thing you might see in a browser is an unrelated agent UI at the call center;
  the authentication itself is never there.
