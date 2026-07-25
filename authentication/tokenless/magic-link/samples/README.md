---
title: "Magic Link (Passwordless Email Login) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Magic Link (Passwordless Email Login) — Sample Capture

A sanitized HAR of request → emailed-link GET → confirm POST → session. **All values
are synthetic.**

- Capture: [magic-link.har](./magic-link.har) (HAR 1.2)

## The request (only an email)

```json
POST /auth/magic-link   {"email":"alice@example.com"}
```

Response is the generic `{"message":"If an account exists, check your email."}` —
identical for existing and non-existing accounts (enumeration protection).

## The emailed link, annotated

```
https://app.example.com/auth/verify?token=ml_SYNTHETIC_9f8e7d6c5b4a3210fedcba98
```

| Part | Value | Notes |
|---|---|---|
| endpoint | `/auth/verify` | GET renders a confirm page; POST consumes the token |
| `token` | `ml_SYNTHETIC_9f8e7d6c5b4a3210fedcba98` | High-entropy, single-use, short TTL (~5–15 min). Server stores only its **hash** |

The bare `GET` does **not** consume the token (defeats link-preview bots); the
follow-up `POST /auth/verify` consumes it atomically.

## The session it sets

```
Set-Cookie: sid=s%3AsynthSESSION0a1b2c3d4e5f6071; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax
```

| Attribute | Meaning |
|---|---|
| `sid` | Opaque server-side session reference — the magic link is now spent |
| `HttpOnly` | Not readable from JavaScript |
| `Secure` | HTTPS only |
| `SameSite=Lax` | First-line CSRF defense |
| `Max-Age=1800` | 30-minute session lifetime |

From here the flow is identical to
[session-cookie](../../session-cookie/README.md): the browser replays `Cookie: sid=...`.

---

**Synthetic note:** the email, token, and session ID are fabricated for documentation
only. No real mailbox, link, or secret appears here.
