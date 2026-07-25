---
title: "HTTP Basic Authentication — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7617, RFC 7616"
---

# HTTP Basic Authentication — Sample Capture

A sanitized HAR showing the `401` challenge, the `Authorization: Basic` retry, and
the credential replayed on a later request. **All values are synthetic.**

- Capture: [http-basic-auth.har](./http-basic-auth.har) (HAR 1.2)

## The challenge (`401`)

```
WWW-Authenticate: Basic realm="Metrics", charset="UTF-8"
```

The server names a **realm**; the browser caches the credential per realm and
replays it automatically for matching URLs.

## The `Authorization` header, decoded

```
Authorization: Basic YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==
```

| Field | Value |
|---|---|
| scheme | `Basic` |
| encoded credential | `YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==` |
| `base64 -d` → | `alice:s3cr3t-synthetic` |
| username | `alice` |
| password | `s3cr3t-synthetic` |

Decode it yourself:

```bash
printf 'YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==' | base64 -d   # alice:s3cr3t-synthetic
```

## Warning: base64 is not encryption

The step above reverses the header in one command — it is **encoding, not
encryption**, and offers no confidentiality. In the HAR the same
`Authorization: Basic` header appears on **both** the `/metrics` and
`/metrics/detail` requests: the raw credential is replayed on every call, so over
plain HTTP the password would be exposed repeatedly. Basic must be TLS-only.

---

**Synthetic note:** `alice` / `s3cr3t-synthetic` and the base64 string are fabricated
for documentation only. No real credentials appear here.
