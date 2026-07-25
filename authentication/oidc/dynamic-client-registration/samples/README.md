---
title: "Dynamic Client Registration — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7591, RFC 7592"
---

# Dynamic Client Registration — Sample Capture

Synthetic, sanitized artifacts for the DCR flow. The `client_id`, `client_secret`,
`registration_access_token`, and software-statement signature are all fabricated
and must never be treated as valid credentials.

- Capture: [`dynamic-client-registration.har`](./dynamic-client-registration.har) (HAR 1.2)

## Entries in the capture

1. `POST /register` → `201 Created` with `client_id`, `client_secret`,
   `registration_access_token`, `registration_client_uri`.
2. `GET /register/s6bhdrkqt3` (RFC 7592) → `200` current metadata.
3. `POST /register` with a bad `redirect_uri` → `400 invalid_redirect_uri`.

## Registration response, annotated

```json
{
  "client_id": "s6bhdrkqt3",
  "client_secret": "SYNTH_cGE5c2VjcmV0X2RvX25vdF91c2U",
  "client_id_issued_at": 1774000000,
  "client_secret_expires_at": 1805536000,
  "registration_access_token": "SYNTH_reg_at_2Yotnf9Xz_do_not_use",
  "registration_client_uri": "https://as.example.com/register/s6bhdrkqt3"
}
```

| Field | Meaning |
|---|---|
| `client_id` | Assigned client identity |
| `client_secret` | Confidential-client secret (**secret** — redact in real captures) |
| `client_secret_expires_at` | Unix time the secret expires; `0` would mean never |
| `registration_access_token` | High-value bearer credential for RFC 7592 management (**secret**) |
| `registration_client_uri` | Per-client management endpoint for GET / PUT / DELETE |

## Decoded software statement (protected registration)

The `software_statement` JWT used in the protected-registration snippet decodes to:

Header:

```json
{ "alg": "RS256", "typ": "JWT", "kid": "directory-2026" }
```

Payload:

```json
{
  "iss": "https://directory.example-federation.org",
  "iat": 1774000000,
  "exp": 1805536000,
  "software_id": "4NRB1-0XZABZI9E6-5SM3R",
  "software_client_name": "Synthetic Sample App",
  "redirect_uris": ["https://client.example.com/cb"],
  "grant_types": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_method": "private_key_jwt"
}
```

These asserted claims override client-supplied JSON — but only after the AS verifies
the signature against the directory's published keys. Here the signature is a
placeholder and will not verify.

## Synthetic-data note

All values are fabricated for documentation. Never substitute real secrets or
tokens.
