---
title: "OAuth 2.0 Client Credentials Grant (Machine-to-Machine) — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 Client Credentials Grant (Machine-to-Machine) — Reading it in DevTools

**Important: there is nothing to see in a browser Network tab for this flow.** The Client
Credentials grant has **no user and no browser** — the client (a service, daemon, or job)
authenticates as itself directly to the `/token` endpoint over a back channel, then calls the
API. Both hops are server-to-server. This page therefore explains how to inspect the calls with
a **debugging proxy or your service's own logs** instead of DevTools.

## How to actually observe it

- **mitmproxy / Charles / Fiddler / Burp**: point your service's HTTPS traffic at the proxy
  (trust its CA in the service's trust store) and read the `/token` and API requests there.
- **curl -v** with the [snippets](./snippets.md): the fastest way to see the exact request and
  response bodies.
- **Service logs / APM**: log the request method, URL, status, and granted `scope` (never the
  secret or the full token).
- **Browser DevTools does not apply** unless a browser-based tool happens to proxy the call —
  there is no front channel to preserve, no redirect, and no cookies.

## The requests, in order

1. **Discovery (optional, back channel)**
   - Request: `GET https://idp.example.com/.well-known/openid-configuration`
   - Read: `token_endpoint`, `jwks_uri`.

2. **Token request (BACK CHANNEL — not browser-visible)**
   - Request: `POST https://idp.example.com/token`
   - Body (form): `grant_type=client_credentials`, `scope=read:reports`.
   - Client authentication, one of:
     - `Authorization: Basic <base64(client_id:client_secret)>` (`client_secret_basic`), or
     - form fields `client_assertion_type=...jwt-bearer` + `client_assertion=<signed JWT>`
       (`private_key_jwt`), or
     - a TLS client certificate (mTLS, RFC 8705).
   - Read the **response** JSON: `access_token`, `token_type=Bearer`, `expires_in`, granted
     `scope`. Confirm there is **no `id_token`** (no user) and **no `refresh_token`**.

3. **Resource call (BACK CHANNEL — not browser-visible)**
   - Request: `GET https://api.example.com/v1/reports`
   - Header: `Authorization: Bearer <access_token>`.
   - On success `200`; on an expired token `401` with `WWW-Authenticate: Bearer
     error="invalid_token"` — the client refetches (step 2) and retries once.

## Decoding the access token (if it's a JWT)

Many authorization servers issue JWT access tokens for this grant. If the token has three
dot-separated parts, base64url-decode the middle part locally:

```sh
echo '<payload-part>' | tr '_-' '/+' | base64 -d 2>/dev/null
```

Read `iss`, `aud` (the API), `exp`, `scope`, `client_id`, and — for mTLS-bound tokens — a
`cnf.x5t#S256` certificate thumbprint. Some ASes issue **opaque** access tokens instead, which
carry no readable claims; the API validates those at the `/introspect` endpoint. Never paste real
tokens into online decoders.

A sanitized capture (as if taken through a proxy) is in [samples/](./samples/README.md).
