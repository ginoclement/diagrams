---
title: "Resource Owner Password Credentials (ROPC) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
rfc: "RFC 6749"
---

# Resource Owner Password Credentials (ROPC) — DevTools Walkthrough

> ⛔ **DEPRECATED.** This walkthrough documents a legacy grant so you can recognize
> it in a capture. The defining, alarming observation is that the user's
> **username and password appear in plaintext in the `POST /token` request body** —
> the client application handled the raw password. That is exactly why ROPC is
> forbidden by OAuth 2.1 and the OAuth Security BCP. Recognizing it in a network
> trace is usually a signal to migrate the client to
> [Authorization Code + PKCE](../authorization-code-pkce/README.md).

All values referenced below are **synthetic** (see [samples/](./samples/README.md)).

## Observable requests, in order

There is only one request in the happy path — no `/authorize`, no redirect.

1. **`POST https://as.example.com/token`** — the credential exchange.
   - Content-Type `application/x-www-form-urlencoded`. Inspect the request body:
     `grant_type=password`, and — the red flag — **`username=...&password=...` in
     cleartext**. In DevTools this is fully visible under the request's "Payload" /
     "Request" tab. Anything that can read the request (a proxy, a browser
     extension, an over-broad log) sees the password.
   - Confidential clients also send `Authorization: Basic <base64 client creds>`.

2. **`200` token response** — decode what came back.
   - `access_token` (JWT here — base64url-decode the payload for `sub`, `scope`,
     `exp`).
   - `id_token` present only when `openid` scope was requested and supported.
   - `refresh_token` often present — for ROPC this is worth disabling or rotating
     aggressively.

## Error responses to recognize

| Status | Body / meaning |
|---|---|
| `400` `invalid_grant` "invalid username or password" | Bad credentials — deliberately does not say which field |
| `400` `invalid_grant` "interaction_required" | MFA / step-up needed; this grant cannot carry it → must switch to a redirect flow |
| `400` `invalid_grant` "account locked" | Locked / expired password; no inline remediation possible |

## What to decode

| Artifact | Where | How to read it |
|---|---|---|
| `username` / `password` | request body | plainly visible — this is the deprecation red flag, redact in any shared capture |
| `access_token` | response body | base64url-decode payload (if JWT) |
| `id_token` | response body | base64url-decode; check `iss`, `aud`, `exp`, `nonce`-absence (ROPC has no nonce) |

## Note

Because the password is in the request, **any** captured ROPC trace contains a live
credential in real life — always redact. All sample material here is synthetic, and
the password shown is fake.
