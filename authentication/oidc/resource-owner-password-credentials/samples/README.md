---
title: "Resource Owner Password Credentials (ROPC) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
rfc: "RFC 6749"
---

# Resource Owner Password Credentials (ROPC) — Sample Capture

> ⛔ **DEPRECATED.** This sample documents a legacy grant. In a real ROPC capture
> the request body contains a **live user password** — always redact it. Everything
> here is synthetic: the username, password, `client_secret`, and all tokens are
> fabricated, and the JWT signatures are the placeholder
> `c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...`.

- Capture: [`resource-owner-password-credentials.har`](./resource-owner-password-credentials.har) (HAR 1.2)

## Entries in the capture

1. `POST /token` `grant_type=password` (username + password in body) → `200` with
   `access_token`, `refresh_token`, `id_token`.
2. Wrong password → `400 invalid_grant` (field-agnostic).
3. MFA required → `400 invalid_grant` / `interaction_required`.

## The request body (the deprecation red flag)

```
grant_type=password&username=alex&password=s3cr3t-synthetic&scope=openid+profile
```

The plaintext `password` in the request is exactly why this grant is forbidden by
OAuth 2.1 — the client (and anything that can read the request) sees it.

## Decoded access token (from the token response)

Header:

```json
{ "alg": "RS256", "typ": "at+jwt", "kid": "as-sig-2026-01" }
```

Payload:

```json
{
  "iss": "https://as.example.com",
  "aud": "https://api.example.com",
  "sub": "248289761001",
  "client_id": "legacy-first-party",
  "scope": "openid profile",
  "iat": 1774000000,
  "exp": 1774003600,
  "jti": "ropc-1122-synthetic"
}
```

## Decoded id_token

```json
{
  "iss": "https://as.example.com",
  "sub": "248289761001",
  "aud": "legacy-first-party",
  "exp": 1774003600,
  "iat": 1774000000,
  "auth_time": 1774000000,
  "name": "Alex Synthetic",
  "preferred_username": "alex"
}
```

| Claim | Meaning |
|---|---|
| `sub` | Stable user identifier |
| `aud` | The legacy client the token was minted for |
| (no `nonce`) | ROPC has no `/authorize` step, so there is no `nonce` binding — one of its weaknesses |

## Annotated notes

- `refresh_token` (`SYNTH_rt_2Yotnf9Xz_do_not_use`) — for ROPC, disable or rotate
  aggressively; it extends the reach of a grant that already mishandled the password.
- The `400 invalid_grant` responses never distinguish bad-user from bad-password,
  and cannot carry an interactive MFA challenge — forcing a switch to
  [Authorization Code + PKCE](../../authorization-code-pkce/README.md).

## Synthetic-data note

All values are fabricated for documentation. Never substitute a real password,
client secret, or live token — and prefer removing this grant entirely.
