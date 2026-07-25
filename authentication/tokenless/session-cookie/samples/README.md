---
title: "Session Cookie Authentication — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Session Cookie Authentication — Sample Capture

A sanitized HAR of the login → authenticated-request → logout flow, with the
cookie decoded and annotated. **All values are synthetic.**

- Capture: [session-cookie.har](./session-cookie.har) (HAR 1.2)

## The `Set-Cookie` from `POST /login`, decoded

```
sid=s%3AsynthSESSION9f8e7d6c5b4a3210; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax
```

| Attribute | Value | Meaning |
|---|---|---|
| name | `sid` | The opaque session identifier — a key into the server's session store, **not** a token containing claims |
| value | `s%3AsynthSESSION9f8e7d6c5b4a3210` | URL-encoded; `%3A` decodes to `:` (a signed-cookie prefix). High-entropy random reference |
| `Path=/` | — | Cookie sent for the whole site |
| `Max-Age=1800` | 30 min | Idle/absolute lifetime; server should also enforce its own store TTL |
| `HttpOnly` | — | Not readable from JavaScript (`document.cookie`) — blunts XSS theft |
| `Secure` | — | Sent only over HTTPS |
| `SameSite=Lax` | — | Not sent on most cross-site requests — first-line CSRF defense |

## Session-ID rotation (fixation defense)

| Stage | `sid` value |
|---|---|
| `GET /login` (pre-auth) | `PRE_AUTH_0000aaaa1111bbbb2222cccc` |
| `POST /login` (post-auth) | `s%3AsynthSESSION9f8e7d6c5b4a3210` |

The identifier **changes at login**, so any pre-login `sid` an attacker planted is
invalid afterward.

## The replayed `Cookie` on `GET /api/me`

```
Cookie: sid=s%3AsynthSESSION9f8e7d6c5b4a3210
```

The browser attaches this automatically on every same-site request; it is the sole
proof of identity. Deleting the server-side record instantly revokes access.

---

**Synthetic note:** `alice`, the password, `sid`, and the CSRF token are fabricated
for documentation only. No real credentials or personal data appear here.
