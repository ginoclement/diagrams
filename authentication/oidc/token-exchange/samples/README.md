---
title: "OAuth 2.0 Token Exchange (RFC 8693) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8693"
---

# OAuth 2.0 Token Exchange (RFC 8693) — Sample Capture

Sanitized, **synthetic** capture artifacts for the delegation exchange.

- [token-exchange.har](./token-exchange.har) — HAR 1.2 with two entries: the
  back-channel `POST /token` exchange and the delegated `GET /orders` call.

All values are fabricated. The JWT signature segment is a placeholder, not a real
signature — but the header and payload segments are genuine base64url and decode to
the JSON shown below.

## Decoded exchange request (`POST /token`)

```http
POST /token HTTP/1.1
Host: as.example.com
Authorization: Basic c3ZjLWE6c3ZjLWEtczNjcjN0        # base64("svc-a:svc-a-s3cr3t")
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
subject_token=AT-user.9a1c7f20
subject_token_type=urn:ietf:params:oauth:token-type:access_token
audience=https://api.example.com          # NARROW the downstream target
scope=read:orders                         # NARROW the scope
```

## Decoded exchange response (`200`)

```jsonc
{
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
  "access_token": "eyJhbGci...c2ln",   // the delegated JWT, decoded below
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "read:orders"
}
```

## Decoded delegated access token (JWT)

The `access_token` above is `header.payload.signature`. Base64url-decoding each
segment:

**Header**

```json
{ "alg": "RS256", "typ": "at+jwt", "kid": "as-2026-07" }
```

**Payload**

```jsonc
{
  "iss": "https://as.example.com",     // issuing STS
  "sub": "248289761001",               // the USER — unchanged by the exchange
  "aud": "https://api.example.com",    // narrowed downstream audience (service B)
  "act": { "sub": "svc-a" },           // ACTOR chain: service A is acting for the user
  "scope": "read:orders",              // narrowed scope
  "client_id": "svc-a",                // the exchanging client
  "exp": 1774000300,                   // 2026-03-17T13:51:40Z
  "iat": 1774000000,                   // 2026-03-17T13:46:40Z
  "jti": "tex-3f9c2a1b"
}
```

**Signature** — `c3ludGhldGljLXNpZ25hdHVyZS1ub3QtcmVhbA` decodes to the ASCII string
`synthetic-signature-not-real`. It is a placeholder; do not attempt to verify it.

### Reading the delegation

- `act.sub = "svc-a"` is the signal that this is **delegation**: downstream service B
  sees "svc-a acting for user 248289761001" and can audit the acting party.
- An **impersonation** token would be identical **minus the `act` claim** — the actor
  would be invisible. That loss of auditability is why delegation is preferred.
- Chained exchanges nest: `"act": { "sub": "svc-b", "act": { "sub": "svc-a" } }`.

> **Synthetic-data note:** every token, id, secret, subject, and timestamp in this
> folder is fabricated for documentation. The JWT is unsigned in any meaningful sense
> and is not valid at any real STS.
