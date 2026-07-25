---
title: "CIBA — Sample Capture & Decoded Tokens"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# CIBA — Sample Capture & Decoded Tokens

Sanitized artifacts for OIDC CIBA (poll mode). All values are **synthetic**.

- HAR capture: [./ciba.har](./ciba.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

The HAR is a **server-side** capture (client back end / egress proxy). CIBA is decoupled
and none of it is observable in a browser; the phone push and approval are out-of-band and
not representable as HTTP.

## The backchannel authentication response

```json
{ "auth_req_id": "1c266114-a1be-4252-8ad1-04986c5b9ac1", "expires_in": 120, "interval": 5 }
```

- `auth_req_id` — opaque handle the client polls with; expires per `expires_in`.
- `interval` — minimum seconds between polls; a `slow_down` error means add ~5s.

## The `id_token` (issued after the user approves)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDM2MDAsImlhdCI6MTc3NDAwMDAwMCwiYXV0aF90aW1lIjoxNzczOTk5OTUwLCJhbXIiOlsiZnB0Iiwib3RwIl0sInVybjpvcGVuaWQ6cGFyYW1zOmp3dDpjbGFpbTphdXRoX3JlcV9pZCI6IjFjMjY2MTE0LWExYmUtNDI1Mi04YWQxLTA0OTg2YzViOWFjMSJ9.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded header

```json
{ "alg": "RS256", "typ": "JWT", "kid": "idp-key-2026" }
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",   // issuer
  "sub": "248289761001",              // subject — the user who approved on their phone
  "aud": "s6BhdRkqt3",                // the CIBA client's client_id
  "exp": 1774003600,
  "iat": 1774000000,
  "auth_time": 1773999950,            // when the user approved on the auth device
  "amr": ["fpt", "otp"],              // fingerprint + OTP on the authentication device
  "urn:openid:params:jwt:claim:auth_req_id": "1c266114-a1be-4252-8ad1-04986c5b9ac1"
                                       // binds this id_token to the backchannel request
}
```

> **`auth_req_id` claim ties it together:** the ID token carries the same `auth_req_id`
> the client received from `/bc-authorize`, so the client can confirm these tokens answer
> *its* request and not a replayed one.

## Reading the HAR

- Entry 1 — `POST /bc-authorize`: request carries `login_hint` and `binding_message`;
  response returns `auth_req_id`, `expires_in`, `interval`.
- Entry 2 — `POST /token`: `400 authorization_pending` (user hasn't approved yet).
- Entry 3 — `POST /token`: `200` with `access_token`, `refresh_token`, and the `id_token`
  decoded above (user approved out-of-band between the two polls).

> Every value is a sanitized placeholder; the signature segment
> (`SIG_synthetic_not_a_real_signature_do_not_verify`) will not verify. The `login_hint`
> phone number is a reserved test number.
