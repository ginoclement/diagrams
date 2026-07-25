---
title: "DPoP — Demonstrating Proof of Possession (RFC 9449) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9449"
---

# DPoP — Demonstrating Proof of Possession (RFC 9449) — DevTools Walkthrough

How to observe DPoP. For a public client (SPA/native), the `/token` and resource
calls originate in the app, so the requests below **are** visible in the browser
Network tab (or a native-app proxy like mitmproxy/Charles). The thing to inspect on
each is the **`DPoP` header** and how the token is bound.

Observable requests, in order:

## 1. `POST /token` — app to AS

- **Where:** browser Network tab (SPA) or app proxy (native).
- **Filter:** filter by the AS host or the `/token` path.
- **Request headers to read:**
  - `DPoP: <proof-jwt>` — the proof. Copy the value and decode it: split on `.` and
    base64url-decode the **header** and **payload** (paste into any JWT decoder, or
    `echo <seg> | base64 -d`). Check:
    - header `typ` = `dpop+jwt`, `alg` = `ES256` (or another asymmetric alg), and a
      `jwk` (the public key).
    - payload `htm` = `POST`, `htu` = the token endpoint URL (must match this
      request), a fresh `iat`, and a unique `jti`.
    - at the token endpoint there is **no `ath`** yet (there is no access token to
      hash).
- **Response to read:**
  - `token_type` = `DPoP` (not `Bearer`).
  - the access token is **bound** via `cnf.jkt` = the SHA-256 thumbprint of the
    proof's `jwk`. For an opaque token you see `jkt` via
    [introspection](../token-introspection/README.md); for a JWT AT it is in the
    payload's `cnf`.

## 2. `GET /resource` — app to API

- **Where:** browser Network tab / app proxy.
- **Filter:** by the API host or `/resource`.
- **Request headers to read:**
  - `Authorization: DPoP <access-token>` — note the **`DPoP` auth scheme**, not
    `Bearer`. A `jkt`-bound token presented as `Bearer` must be rejected.
  - `DPoP: <proof-jwt>` — a **different** proof from step 1. Decode it and confirm:
    - `htm` = `GET`, `htu` = the resource URL.
    - a **new** `jti` (never the one from step 1) and a fresh `iat`.
    - `ath` present = base64url(SHA-256(access_token)). To verify by hand:
      `printf %s "mF_9.B5f-4.1JqM" | openssl dgst -binary -sha256 | basenc --base64url`
      and compare to the `ath` claim.

## 3. Nonce challenge — `401`/`400` with `DPoP-Nonce`

- **What to read:** a rejected request returns `error="use_dpop_nonce"` plus a
  `DPoP-Nonce: <value>` response header (and `WWW-Authenticate: DPoP ...` at the
  resource server). The client must read that header, add a `nonce` claim to the next
  proof, and retry. In the Network tab you will see the failed attempt immediately
  followed by a successful retry.

## Rejections to recognize

- **Stolen token, no/invalid proof:** `401 invalid_token` — `cnf.jkt` present but no
  matching proof, or the proof's key thumbprint ≠ the token's `jkt`.
- **Proof replay:** reusing a `jti` within the server's window → `401 invalid_token`.

See [samples/dpop.har](./samples/dpop.har) and the fully decoded proofs in
[samples/README.md](./samples/README.md).
