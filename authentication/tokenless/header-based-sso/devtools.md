---
title: "Header-Based SSO (Proxy-Injected Identity Headers) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Header-Based SSO (Proxy-Injected Identity Headers) — DevTools Walkthrough

How to observe header-based SSO — and understand why the interesting headers live on
a hop the browser cannot see. All values are **synthetic**.

## What the browser's Network tab shows

In the **Network** tab you only see the **browser ↔ proxy** hop:

1. **Unauthenticated request → redirect to login.** With no proxy session, the proxy
   returns a `302` to the IdP (`Location: https://idp.example.com/authorize?...`).
   The app is never reached.

2. **After login, `GET /reports` → `200`.** The request carries the **proxy's own
   session cookie** (e.g. `Cookie: proxy_session=...`) — *not* any identity header.
   The browser does not send, and must never be able to send, `X-Forwarded-User`.

## The proxy-injected headers are on the proxy→app hop (not in the browser)

The identity headers — `REMOTE_USER`, `X-Forwarded-User`, `X-Auth-Request-Email`,
`X-Forwarded-Groups` — are added by the proxy on its **upstream** request to the
backend. That hop is server-to-server and does **not** appear in the browser's
Network tab. To observe it you need proxy access logs, an upstream capture, or the
app's own request logging. The sample HAR reconstructs both hops so you can see the
injected headers.

## The key thing to verify: inbound stripping

The classic vulnerability is a proxy that **injects** `X-Forwarded-User` when it
authenticates but **passes a client-supplied copy through** when it does not. To test:

- Send `X-Forwarded-User: admin` from the browser and confirm the proxy **overwrites
  or strips** it — the backend must see the real authenticated user (or nothing),
  never the attacker's value.
- Try a spoof **directly to the app's address** (bypassing the proxy): it must be
  blocked by network policy and/or the app rejecting headers from a non-proxy peer.
- Watch for header-smuggling variants: `X_Forwarded_User` (underscore), duplicate
  headers, HTTP/1.1 vs HTTP/2 case differences — the proxy must strip by
  canonicalized name.

## What to inspect where

| Signal | Where |
|---|---|
| Redirect to IdP when unauthenticated | Network → the `302` row → Response Headers → `Location` |
| Proxy session cookie (browser↔proxy) | Network → any row → Request Headers → `Cookie` |
| Injected identity headers (proxy→app) | Proxy access log / upstream capture / app log — **not** the browser |
| Inbound strip behavior | Send a forged `X-Forwarded-User` and check what the backend received |

See [samples/README.md](./samples/README.md) for a HAR of both hops with the injected
headers annotated.
