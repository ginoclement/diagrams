---
title: "OAuth 2.0 Client Credentials Grant (Machine-to-Machine) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 Client Credentials Grant (Machine-to-Machine) — Sample Capture

A sanitized capture for the [Client Credentials grant](../README.md).

- Capture file: [`./client-credentials.har`](./client-credentials.har)

The HAR has two entries: the `/token` request and the resource call. **Neither is visible in a
browser** — this flow has no front channel. The capture is presented as if taken through a
debugging proxy. There is no `id_token` and no `refresh_token` — that is expected for a grant
with no user.

## Decoded access token

The AS issued a **JWT access token** here (some ASes issue opaque tokens instead). It is a JWT
(`header.payload.signature`); decode the first two parts:

### Header (annotated)

```jsonc
{
  "alg": "RS256",             // signature algorithm; the API verifies via the IdP JWKS
  "typ": "JWT",               // token type
  "kid": "idp-2026-07-key1"   // key id selecting the JWKS public key
}
```

### Payload / claims (annotated)

```jsonc
{
  "iss": "https://idp.example.com",           // issuer — the authorization server
  "sub": "svc-report-runner",                 // subject — the CLIENT itself (no human user)
  "aud": "https://api.example.com",           // audience — the resource server this token is for
  "exp": 1774000000,                          // expiry (Unix seconds)
  "iat": 1773996400,                          // issued-at
  "scope": "read:reports",                    // granted scope (may be narrower than requested)
  "client_id": "svc-report-runner",           // the authenticated client
  "jti": "a1b2c3d4-e5f6-4a7b-8c9d-000000000001" // unique token id (replay tracking)
}
```

Note `sub == client_id`: the workload is both the caller and the subject. The API validates the
signature (JWKS via `kid`), `iss`, `aud` (itself), `exp`, and the required `scope`.

---

**Everything here is synthetic.** Client id, secret, tokens, and signature are all fake.
