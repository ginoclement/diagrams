---
title: "Resource Owner Password Credentials (ROPC) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
rfc: "RFC 6749"
---

# Resource Owner Password Credentials (ROPC) — Client Snippets

> ⛔ **DEPRECATED.** These snippets exist only to document a legacy grant. ROPC
> POSTs the end user's **username and password directly** to the token endpoint —
> the client sees the raw password. It is incompatible with MFA, passkeys,
> risk-based auth, and federation, and is removed/forbidden by OAuth 2.1 and the
> OAuth Security BCP. Do **not** use it for new work. Use
> [Authorization Code + PKCE](../authorization-code-pkce/README.md) instead.

Every value is **synthetic and sanitized** — the username, password, hosts,
`client_id`, and tokens are fabricated. Replace `PLACEHOLDER` values only if you are
maintaining a legacy first-party client that already relies on this grant.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `as.example.com` | Legacy authorization server still exposing `grant_type=password` |
| `legacy-first-party` | Confidential `client_id` restricted to this grant |
| `alex` / `s3cr3t-synthetic` | Synthetic user credentials (the anti-pattern: the client handles these) |

## Step 1 — POST username + password to `/token`

Note what makes this deprecated: the user's **plaintext password travels in the
request body** to the token endpoint. There is no `/authorize` step and no browser
redirect.

```bash
curl -sS -X POST https://as.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "legacy-first-party:PLACEHOLDER_CLIENT_SECRET" \
  -d "grant_type=password" \
  -d "username=alex" \
  -d "password=s3cr3t-synthetic" \
  -d "scope=openid profile"
```

Synthetic `200` response (includes `id_token` because `openid` scope was present):

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6ImFzLXNpZy0yMDI2LTAxIn0.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwiYXVkIjoiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJzdWIiOiIyNDgyODk3NjEwMDEiLCJjbGllbnRfaWQiOiJsZWdhY3ktZmlyc3QtcGFydHkiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIiwiaWF0IjoxNzc0MDAwMDAwLCJleHAiOjE3NzQwMDM2MDAsImp0aSI6InJvcGMtMTEyMi1zeW50aGV0aWMifQ.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "SYNTH_rt_2Yotnf9Xz_do_not_use",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFzLXNpZy0yMDI2LTAxIn0.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwic3ViIjoiMjQ4Mjg5NzYxMDAxIiwiYXVkIjoibGVnYWN5LWZpcnN0LXBhcnR5IiwiZXhwIjoxNzc0MDAzNjAwLCJpYXQiOjE3NzQwMDAwMDAsImF1dGhfdGltZSI6MTc3NDAwMDAwMCwibmFtZSI6IkFsZXggU3ludGhldGljIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWxleCJ9.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef",
  "scope": "openid profile"
}
```

## Step 2 — Error cases

```bash
# Wrong password -> 400 invalid_grant (never reveals which field was wrong)
curl -sS -i -X POST https://as.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "legacy-first-party:PLACEHOLDER_CLIENT_SECRET" \
  -d "grant_type=password" -d "username=alex" -d "password=wrong"
# -> 400 {"error":"invalid_grant","error_description":"invalid username or password"}
```

```bash
# MFA required — the grant cannot carry an interactive challenge -> 400
curl -sS -i -X POST https://as.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "legacy-first-party:PLACEHOLDER_CLIENT_SECRET" \
  -d "grant_type=password" -d "username=alex" -d "password=s3cr3t-synthetic"
# -> 400 {"error":"invalid_grant","error_description":"interaction_required: second factor needed"}
# The client MUST fall back to Authorization Code + PKCE to complete MFA.
```

```bash
# Account locked / password expired -> 400 invalid_grant, no inline remediation
# -> 400 {"error":"invalid_grant","error_description":"account locked"}
```

## SDK example (Node.js) — legacy maintenance only

```javascript
// Built-in fetch (Node 18+). DEPRECATED grant — for legacy maintenance only.
// The client necessarily handles the raw password; never log or store it.
const res = await fetch("https://as.example.com/token", {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    authorization: "Basic " + Buffer.from("legacy-first-party:PLACEHOLDER_CLIENT_SECRET").toString("base64"),
  },
  body: new URLSearchParams({
    grant_type: "password",
    username: "alex",
    password: "s3cr3t-synthetic", // <- the anti-pattern: password in the client's hands
    scope: "openid profile",
  }).toString(),
});
const tokens = await res.json();
// On 400 invalid_grant with interaction_required, switch to Authorization Code + PKCE.
console.log(res.status, tokens);
```

## Synthetic-data note

The username, password, `client_secret`, and all tokens are fabricated. The JWT
signature segments are the literal placeholder
`c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...` and will not verify. Never place a real
user password or live token in these files — and prefer removing this grant from the
client's allowed `grant_types` entirely.
