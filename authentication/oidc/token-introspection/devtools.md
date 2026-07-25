---
title: "OAuth 2.0 Token Introspection (RFC 7662) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7662"
---

# OAuth 2.0 Token Introspection (RFC 7662) — DevTools Walkthrough

How to observe the introspection flow. The important caveat up front:

> **Introspection is a back-channel call.** `POST /introspect` is made by the
> **resource server** (or an API gateway/PEP) to the authorization server, machine
> to machine. It **does not appear in the browser's Network tab.** To watch it you
> need server-side logging, a reverse-proxy/gateway access log, or an mTLS-aware
> capture on the resource-server host — not Chrome/Firefox DevTools. Only the
> client → resource-server request (step 1) is visible in a browser.

Observable requests, in order:

## 1. `GET /resource` — client to resource server (browser-visible)

- **Where:** browser Network tab, or the resource server's inbound access log.
- **Filter:** filter the Network tab by your API host (`api.example.com`) or by
  the `/resource` path.
- **Request headers to read:**
  - `Authorization: Bearer mF_9.B5f-4.1JqM` — the opaque access token. Note it is
    **opaque**: it is *not* a JWT, so there is nothing to base64url-decode. Its
    meaning is resolved only by introspection.
- **Response to read:**
  - `200` with the protected payload on success.
  - `401` with `WWW-Authenticate: Bearer error="invalid_token"` when introspection
    returned `active:false`.

## 2. `POST /introspect` — resource server to AS (back-channel, NOT in browser)

- **Where:** resource-server logs / gateway logs only. Reproduce it yourself with
  the `curl` in [snippets.md](./snippets.md).
- **Filter:** on the AS side, filter access logs for the `/introspect` path.
- **Request to read:**
  - `Authorization: Basic <base64(rs-id:rs-secret)>` — the resource server's own
    client authentication. Decode the Basic value with any base64 tool to confirm
    the caller identity (never log the secret in production).
  - Form body: `token=...` and `token_type_hint=access_token` (URL-decode the body
    to read them).
- **Response claims to read (active token):**
  - `active` — the canonical boolean. Everything downstream hinges on this.
  - `scope` — space-delimited; check the required scope is present.
  - `aud` — must match this resource server's identifier.
  - `exp` / `iat` / `nbf` — UNIX seconds; convert with `date -d @1774000000` (or
    `new Date(1774000000*1000)` in a JS console) to confirm the token is live.
  - `sub`, `client_id`, `username` — who the token represents and who obtained it.
  - `cnf` — present for sender-constrained tokens; `jkt` (DPoP JWK thumbprint) or
    `x5t#S256` (mTLS cert thumbprint). If present, the API must additionally verify
    proof of possession — see [DPoP](../dpop/README.md).
- **Response to read (inactive token):** exactly `{"active":false}` — confirm no
  other claims are echoed. Anything more is an information leak.

## 3. Caching (no request at all)

A resource server may cache a positive `active:true` result up to `exp` and skip
`/introspect` on subsequent calls. In logs this shows up as **step 1 with no
matching step 2** — the introspection round-trip is absent until the cache TTL
expires. That is expected; the trade-off is a revocation-detection delay.

See the captured requests in [samples/token-introspection.har](./samples/token-introspection.har)
and the annotated introspection response in [samples/README.md](./samples/README.md).
