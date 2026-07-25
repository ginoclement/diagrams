---
title: "mTLS Client Auth and Certificate-Bound Tokens — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# mTLS Client Auth and Certificate-Bound Tokens — Sample Capture

Synthetic, sanitized artifacts for the certificate-bound-token flow. Nothing here
is real: hosts, `client_id`, the certificate thumbprint, and every token are
fabricated, and the JWT signature is the literal placeholder
`c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...`.

- Capture: [`mtls-bound-tokens.har`](./mtls-bound-tokens.har) (HAR 1.2)

## Entries in the capture

1. `POST /token` (mTLS) → `200` with a certificate-bound `access_token`.
2. `GET /accounts` presenting the **same** cert → `200`.
3. `GET /accounts` with **no** bound cert → `401 invalid_token`.
4. `POST /introspect` → `200` returning `cnf.x5t#S256`.

## Decoded access token

Header (base64url of segment 1):

```json
{ "alg": "RS256", "typ": "at+jwt", "kid": "as-sig-2026-01" }
```

Payload (base64url of segment 2):

```json
{
  "iss": "https://as.example.com",
  "aud": "https://api.example.com",
  "sub": "s6bhdrkqt3-client",
  "client_id": "s6bhdrkqt3",
  "scope": "accounts",
  "iat": 1774000000,
  "exp": 1774003600,
  "jti": "6f2a1c9e-synthetic",
  "cnf": { "x5t#S256": "bwcK0esc3ACC3DB2Y5_lESsXE8u9ie-mkDs5CdrEIYY" }
}
```

## Annotated fields

| Claim | Value | Meaning |
|---|---|---|
| `typ` | `at+jwt` | RFC 9068 access-token JWT |
| `cnf` | object | Confirmation claim — this is what binds the token |
| `cnf.x5t#S256` | `bwcK0esc3ACC3DB2Y5_lESsXE8u9ie-mkDs5CdrEIYY` | `base64url(SHA-256(DER(client leaf cert)))` |
| `aud` | `https://api.example.com` | Resource server that must bind-check |
| `client_id` | `s6bhdrkqt3` | Confidential client that presented the cert |

The resource server recomputes `x5t#S256` over the certificate on the TLS
connection and requires it to equal `cnf.x5t#S256`. Entry 2 matches (served);
entry 3 does not (`401`). Entry 4 shows the same `cnf` returned via introspection
for opaque tokens.

## Synthetic-data note

All values are fabricated for documentation. Do not treat the thumbprint or tokens
as valid, and never replace them with real certificates or tokens.
