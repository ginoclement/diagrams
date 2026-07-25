---
title: "OIDC Hybrid Flow — Sample Capture & Decoded Tokens"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Hybrid Flow — Sample Capture & Decoded Tokens

Sanitized artifacts for the OIDC Hybrid Flow (`response_type=code id_token`). All values
are **synthetic**.

- HAR capture: [./hybrid.har](./hybrid.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

Hybrid issues **two** ID tokens: the front-channel one (with `c_hash`) in the authorize
response, and the back-channel one from `/token`. Both are decoded below.

## Front-channel `id_token` (from the authorize response — carries `c_hash`)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDM2MDAsImlhdCI6MTc3NDAwMDAwMCwiYXV0aF90aW1lIjoxNzczOTk5OTAwLCJub25jZSI6Im4teHl6LWh5YnJpZC03NyIsImNfaGFzaCI6IkxEa3RLZG9RYWszUGswY25YeENsdEEiLCJzX2hhc2giOiJhR2NpT2lKU1V6STEiLCJhY3IiOiIxIn0.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",
  "sub": "248289761001",
  "aud": "s6BhdRkqt3",
  "exp": 1774003600,
  "iat": 1774000000,
  "auth_time": 1773999900,
  "nonce": "n-xyz-hybrid-77",         // MUST match what the RP sent — replay binding
  "c_hash": "LDktKdoQak3Pk0cnXxCltA", // base64url(left-half(SHA-256(code))) — binds the code
  "s_hash": "aGciOiJSUzI1",           // state hash (when present) — binds state
  "acr": "1"
}
```

> **`c_hash` is the whole reason to use hybrid.** Validate the token fully (signature,
> `iss`, `aud`, `exp`, `nonce`) **then** recompute `base64url(left-half(SHA-256(code)))`
> and compare to `c_hash`. A mismatch means the code was injected/substituted — reject and
> never redeem it. (The `c_hash` value above is illustrative synthetic data and is not the
> real hash of the sample code.)

## Back-channel `id_token` (from `/token`)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDM2MDAsImlhdCI6MTc3NDAwMDAwNSwiYXV0aF90aW1lIjoxNzczOTk5OTAwLCJub25jZSI6Im4teHl6LWh5YnJpZC03NyIsImVtYWlsIjoiam9yZGFuLnJpdmVyYUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",   // MUST equal the front-channel token's iss
  "sub": "248289761001",              // MUST equal the front-channel token's sub
  "aud": "s6BhdRkqt3",
  "exp": 1774003600,
  "iat": 1774000005,                  // issued a few seconds later than the front-channel one
  "auth_time": 1773999900,
  "nonce": "n-xyz-hybrid-77",
  "email": "jordan.rivera@example.com",  // synthetic — richer claims than the front token
  "email_verified": true
}
```

> **Cross-token consistency:** after `/token`, compare the two ID tokens — `iss` and `sub`
> MUST be identical. A mismatch means discard the tokens and restart authentication.

## Reading the HAR

- Entry 1 — `GET /authorize` (form_post) → HTML auto-submit form.
- Entry 2 — `POST /cb` → the front-channel `code` + `id_token` + `state` land at the RP.
- Entry 3 — `POST /token` (BACK-CHANNEL) → `access_token` + the second `id_token`.
- Entry 4 — `GET /resource` with the bearer access token.

> Every value is a sanitized placeholder; the signature segment
> (`SIG_synthetic_not_a_real_signature_do_not_verify`) will not verify.
