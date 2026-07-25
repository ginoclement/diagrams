---
title: "RP-Initiated Logout — Sample Capture & Decoded id_token_hint"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RP-Initiated Logout — Sample Capture & Decoded id_token_hint

Sanitized artifacts for OIDC RP-Initiated Logout 1.0. All values are **synthetic**.

- HAR capture: [./rp-initiated-logout.har](./rp-initiated-logout.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

The key artifact is the `id_token_hint` sent to the `end_session_endpoint`. The IdP uses
it to identify which session to end (via `sub`/`sid`) and to skip the confirmation prompt.

## The `id_token_hint`

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
  "iss": "https://idp.example.com",   // issuer — IdP validates this
  "sub": "248289761001",              // subject — identifies whose session to end
  "aud": "s6BhdRkqt3",                // this RP's client_id — IdP validates aud
  "exp": 1774003600,                  // may be EXPIRED and still accepted as a hint
  "iat": 1774000000,
  "auth_time": 1773999900,
  "nonce": "n-0S6_WzA2Mj",
  "sid": "abc123session",             // session id — the exact SSO session to terminate
  "acr": "urn:mace:incommon:iap:silver",
  "amr": ["pwd", "otp"],
  "email": "jordan.rivera@example.com"  // synthetic address
}
```

> **Why an expired hint still works:** the IdP validates the `id_token_hint`'s signature
> and `aud`, not its `exp`. A hint that is past `exp` is still perfectly good for
> *identifying the session* to end.

## Reading the HAR

- Entry 1 — `GET /logout` at the RP: `302` that clears `rp1_session` and redirects to the
  IdP `end_session_endpoint` with the hint, `post_logout_redirect_uri`, and `state`.
- Entry 2 — `GET /end_session` at the IdP: clears `idp_session`, `302` to the registered
  `post_logout_redirect_uri` echoing `state`.
- Entry 3 — `GET /loggedout?state=af0ifjsldkj` return leg at the RP.

> Every value is a sanitized placeholder; the signature segment
> (`SIG_synthetic_not_a_real_signature_do_not_verify`) will not verify.
