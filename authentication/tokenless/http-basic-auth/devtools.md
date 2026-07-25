---
title: "HTTP Basic Authentication — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7617, RFC 7616"
---

# HTTP Basic Authentication — DevTools Walkthrough

How to read an HTTP Basic exchange in the browser **Network** tab. All values are
**synthetic**.

Open DevTools, enable **Preserve log**, filter to **Fetch/XHR** + **Doc**.

## Observable requests, in order

1. **First request with no credentials → `401 Unauthorized`**
   - Response header **`WWW-Authenticate: Basic realm="Metrics"`**. This is the
     server's challenge; the browser reacts by popping the native username/password
     dialog for that realm.

2. **Retry carrying `Authorization: Basic ...`**
   - In **Request Headers** you see:
     ```
     Authorization: Basic YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==
     ```
   - The part after `Basic ` is `base64(username:password)`. To decode in the Console:
     ```js
     atob("YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==")   // "alice:s3cr3t-synthetic"
     ```
     or in a terminal: `printf 'YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==' | base64 -d`.

3. **Every subsequent request** — the browser **re-attaches the same
   `Authorization: Basic` header automatically** to all requests in the realm. Click
   through several rows and confirm the identical header on each: there is no session,
   no token, and no logout — the raw credential is replayed each time.

## Security warning — base64 is NOT encryption

The `Authorization: Basic` value is **only base64-encoded**, which is fully
reversible with `atob()` / `base64 -d` (step 2). It provides **zero**
confidentiality. Over plain HTTP anyone on the path reads the password on *every*
request. This is why Basic **must** be TLS-only (and paired with HSTS). Treat a
captured Basic header exactly as you would the plaintext password.

## What to inspect where

| Signal | Where in DevTools |
|---|---|
| `WWW-Authenticate: Basic realm=...` | Network → the `401` row → Headers → Response Headers |
| `Authorization: Basic base64(user:pass)` | Network → any authenticated row → Headers → Request Headers |
| Decoded credential | Console: `atob("<b64>")` (demonstrates reversibility) |

See [samples/README.md](./samples/README.md) for a captured HAR with the base64
Basic header decoded.
