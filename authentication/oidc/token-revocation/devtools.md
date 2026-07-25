---
title: "OAuth 2.0 Token Revocation (RFC 7009) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7009"
---

# OAuth 2.0 Token Revocation (RFC 7009) — DevTools Walkthrough

How to observe revocation. The key caveat:

> **`POST /revoke` is usually a back-channel call.** It is made by the **client**
> (often a confidential server-side client) directly to the authorization server,
> using client authentication. In a traditional web app that call happens on your
> server, so it **does not appear in the browser's Network tab.** A public SPA that
> revokes from the browser is the exception — there you *will* see it in DevTools.
> To watch a confidential-client revocation, use server-side or AS access logs.

Observable requests, in order:

## 1. `POST /revoke` — client to AS (usually back-channel)

- **Where:** client server logs or AS access logs; browser Network tab only for a
  public/browser client.
- **Filter:** filter for the `/revoke` path (host `as.example.com`).
- **Request to read:**
  - `Authorization: Basic <base64(client-id:secret)>` — the caller's client
    authentication. Decode the Basic value to confirm which client is revoking.
  - Form body (URL-decode it): `token=...` and optionally
    `token_type_hint=refresh_token|access_token`.
- **Response to read:**
  - `200` with an **empty body** — success. Crucially, `200` is also returned for an
    **unknown or already-invalid** token: the endpoint is deliberately not a validity
    oracle, so a `200` tells you nothing about whether the token existed.
  - `400 unsupported_token_type` — the token type cannot be revoked here.
  - `401 invalid_client` — client authentication failed (the *only* meaningful error).

## 2. `GET /resource` — the downstream effect (browser-visible)

- **Where:** browser Network tab / resource-server inbound logs.
- **Filter:** by your API host or `/resource`.
- **What to read:** after revoking, the next call with the revoked token returns
  `401` with `WWW-Authenticate: Bearer error="invalid_token"` — **if** the resource
  server validates via introspection (immediate). A resource server that only
  validates a self-contained JWT locally keeps accepting the token until its `exp`.

## 3. `POST /introspect` — how the API learns it's revoked (back-channel, NOT in browser)

- **Where:** resource-server / AS logs only — same back-channel caveat as
  [Token Introspection](../token-introspection/README.md).
- **What to read:** after revocation the introspection response flips to
  `{"active":false}`. That flip is what turns step 2 into a `401`.

## Blast radius to verify

Revoking a **refresh token** should cascade: its dependent **access tokens** and,
under rotation, the whole **token family** stop working. Confirm by introspecting a
sibling access token after revoking the refresh token — it too should read
`active:false`.

See [samples/token-revocation.har](./samples/token-revocation.har) and the annotated
responses in [samples/README.md](./samples/README.md).
