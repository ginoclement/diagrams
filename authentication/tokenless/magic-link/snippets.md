---
title: "Magic Link (Passwordless Email Login) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Magic Link (Passwordless Email Login) — Client Snippets

Runnable client snippets for the magic-link flow: request a link, click the emailed
link, land a session. All hosts, emails, and tokens are **synthetic** placeholders.

## 1. Request a magic link

```bash
curl -i -X POST https://app.example.com/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com"}'
# -> 200 OK  {"message":"If an account exists, check your email."}
# NOTE: identical response whether or not the address has an account
# (enumeration protection). The server stores only a HASH of the token.
```

## 2. The emailed link (what lands in the inbox)

```
https://app.example.com/auth/verify?token=ml_SYNTHETIC_9f8e7d6c5b4a3210fedcba98
```

The `token` is a high-entropy, single-use, short-TTL (typically 5–15 min) value.

## 3. Click the link — landing page (GET does NOT consume the token)

```bash
# The GET only renders a "Confirm sign-in" page; a bare GET must not consume the
# token, because mail scanners and link-preview bots follow links.
curl -i -c cookies.txt \
  "https://app.example.com/auth/verify?token=ml_SYNTHETIC_9f8e7d6c5b4a3210fedcba98"
# -> 200 OK  <form method="POST" action="/auth/verify"> ... Confirm ... </form>
```

## 4. Confirm (POST) — token consumed atomically, session established

```bash
curl -i -b cookies.txt -c cookies.txt \
  -X POST https://app.example.com/auth/verify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=ml_SYNTHETIC_9f8e7d6c5b4a3210fedcba98"
# -> 303 See Other, Location: /dashboard
# -> Set-Cookie: sid=s%3AsynthSESSION0a1b2c3d4e5f6071; HttpOnly; Secure; SameSite=Lax; Max-Age=1800
# A SECOND POST with the same token now fails: single-use, already consumed.
```

## SDK / library example (Node.js — request then verify)

```js
const base = "https://app.example.com";

// Step 1: request the link (client only submits an email).
await fetch(`${base}/auth/magic-link`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "alice@example.com" }),
});

// Step 4: after the user clicks + confirms, the token is exchanged for a session.
const verify = await fetch(`${base}/auth/verify`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ token: "ml_SYNTHETIC_9f8e7d6c5b4a3210fedcba98" }),
  redirect: "manual",
});
const sessionCookie = verify.headers.getSetCookie(); // sid=... HttpOnly; Secure; SameSite=Lax
console.log(sessionCookie);
```

---

**Synthetic note:** `alice@example.com`, the token, and the session ID are fabricated
for documentation. The token is a one-time credential in transit, never a retained
bearer token. No real email addresses or secrets appear here.
