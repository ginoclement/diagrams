---
title: "JAR / JARM — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9101"
---

# JAR / JARM — Sample Capture

Synthetic, sanitized artifacts for the JAR/JARM flow. The request object, JARM
response JWT, `code`, and id_token are fabricated; both JWT signatures are the
placeholder `c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...` and will not verify.

- Capture: [`jar-jarm.har`](./jar-jarm.har) (HAR 1.2)

## Entries in the capture

1. `GET /authorize` with a signed `request` object → `302` back with a `response`
   (JARM) JWT.
2. `POST /token` → `200` with `id_token` + `access_token`.

## Decoded request object (JAR)

Header:

```json
{ "alg": "RS256", "typ": "oauth-authz-req+jwt", "kid": "client-sig-1" }
```

Payload:

```json
{
  "iss": "s6bhdrkqt3",
  "aud": "https://as.example.com",
  "response_type": "code",
  "client_id": "s6bhdrkqt3",
  "redirect_uri": "https://client.example.com/cb",
  "scope": "openid profile",
  "state": "af0ifjsldkj",
  "nonce": "n-0S6_WzA2Mj",
  "code_challenge": "K2-ltc83acc4h0c9w6ESC_rEMTJ3bwc-uCHaoeK1t8U",
  "code_challenge_method": "S256",
  "response_mode": "jwt",
  "exp": 1774000300,
  "iat": 1774000000
}
```

| Claim | Meaning |
|---|---|
| `typ: oauth-authz-req+jwt` | Marks this JWT as a JAR request object |
| `response_mode: jwt` | Asks the AS to return a JARM (JWT) response |
| `code_challenge` | PKCE binding, carried inside the signed object |
| `iss` / `aud` | Client identifies itself; `aud` is the target AS |

## Decoded JARM response

Header:

```json
{ "alg": "RS256", "typ": "JWT", "kid": "as-sig-2026-01" }
```

Payload:

```json
{
  "iss": "https://as.example.com",
  "aud": "s6bhdrkqt3",
  "exp": 1774000120,
  "code": "SplxlOBeZQQYbYS6WxSbIA",
  "state": "af0ifjsldkj"
}
```

| Claim | Meaning |
|---|---|
| `iss` | The AS that answered — **must** match the AS the client sent to (mix-up defense) |
| `aud` | Must equal the client's `client_id` |
| `code` | Trustworthy only after signature + `iss`/`aud` checks pass |
| `state` | Echoed CSRF token; must match what the client sent |

## Decoded id_token (from the token response)

```json
{
  "iss": "https://as.example.com",
  "sub": "248289761001",
  "aud": "s6bhdrkqt3",
  "exp": 1774003600,
  "iat": 1774000000,
  "nonce": "n-0S6_WzA2Mj",
  "auth_time": 1774000000,
  "name": "Alex Synthetic",
  "preferred_username": "alex"
}
```

The `nonce` matches the request object's `nonce`, binding the id_token to this
request.

## Synthetic-data note

All values are fabricated for documentation. A JWT that does not verify must be
discarded; never substitute real tokens or codes.
