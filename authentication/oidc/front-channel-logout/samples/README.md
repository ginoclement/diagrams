---
title: "Front-Channel Logout — Sample Capture & Decoded Session Token"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Front-Channel Logout — Sample Capture & Decoded Session Token

Sanitized artifacts for OIDC Front-Channel Logout 1.0. All values are **synthetic**.

- HAR capture: [./front-channel-logout.har](./front-channel-logout.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

Front-channel logout carries **no token in the iframe request** — only `iss` and `sid`
query parameters. The `sid` the RP receives here must match the `sid` **claim** it was
issued in that user's ID token at login. That ID token is decoded below so you can see
where the `sid` originates and confirm the correlation.

## The iframe request (no token — just parameters)

```
GET https://rp1.example.com/frontchannel-logout?iss=https://idp.example.com&sid=abc123session
```

- `iss=https://idp.example.com` — must equal the RP's expected issuer.
- `sid=abc123session` — must match the `sid` claim below; otherwise the RP ignores it
  (logout-CSRF defense).

## Source ID token issued at login (where `sid` came from)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDM2MDAsImlhdCI6MTc3NDAwMDAwMCwiYXV0aF90aW1lIjoxNzczOTk5OTAwLCJub25jZSI6Im4tMFM2X1d6QTJNaiIsInNpZCI6ImFiYzEyM3Nlc3Npb24iLCJhY3IiOiJ1cm46bWFjZTppbmNvbW1vbjppYXA6c2lsdmVyIiwiYW1yIjpbInB3ZCIsIm90cCJdLCJlbWFpbCI6ImpvcmRhbi5yaXZlcmFAZXhhbXBsZS5jb20ifQ.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded header

```json
{ "alg": "RS256", "typ": "JWT", "kid": "idp-key-2026" }
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",   // issuer — matches the iss query param at logout
  "sub": "248289761001",              // subject
  "aud": "s6BhdRkqt3",                // this RP's client_id
  "exp": 1774003600,
  "iat": 1774000000,
  "auth_time": 1773999900,
  "nonce": "n-0S6_WzA2Mj",
  "sid": "abc123session",             // <-- session id; the front-channel sid MUST match this
  "acr": "urn:mace:incommon:iap:silver",
  "amr": ["pwd", "otp"],
  "email": "jordan.rivera@example.com"  // synthetic address
}
```

## Reading the HAR

- Entry 1 — the IdP `end_session` page whose HTML embeds one hidden iframe per RP.
- Entry 2 — RP1 frame: request **carries** `rp1_session`; response clears it → logged out.
- Entry 3 — RP2 frame: request has **no cookie** (third-party partitioning) → nothing to
  clear → **partial logout**, RP2 session survives.
- Entry 4 — the `post_logout_redirect_uri` return, which fires regardless of frame results.

> Every value is a sanitized placeholder; the signature segment
> (`SIG_synthetic_not_a_real_signature_do_not_verify`) will not verify.
