---
title: "OAuth 2.0 Token Revocation (RFC 7009) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7009"
---

# OAuth 2.0 Token Revocation (RFC 7009) — Sample Capture

Sanitized, **synthetic** capture artifacts for the revocation flow.

- [token-revocation.har](./token-revocation.har) — HAR 1.2 with three entries: the
  back-channel `POST /revoke`, the follow-on `GET /resource` that now returns `401`,
  and the back-channel `POST /introspect` showing the token is inactive.

All values are fabricated.

## Annotated revocation request

```http
POST /revoke HTTP/1.1
Host: as.example.com
Authorization: Basic czZCaGRSa3F0MzpjbGktczNjcjN0LXNoaGg=   # base64("s6BhdRkqt3:cli-s3cr3t-shhh")
Content-Type: application/x-www-form-urlencoded

token=rt.8f3c1d9a-family-01&token_type_hint=refresh_token
```

- `token` — the credential being invalidated (a refresh token here).
- `token_type_hint` — an optimization only; if it is wrong the AS falls back to
  searching other token types and still revokes.
- The `Basic` value decodes to the client id and secret (secret redacted in real
  logs).

## Annotated revocation response

```http
HTTP/1.1 200 OK
Cache-Control: no-store

(empty body)
```

- `200` + empty body = success. **`200` is also returned for an unknown or
  already-invalid token** (RFC 7009 §2.2) — the endpoint is intentionally not a
  validity oracle, so this status conveys nothing about prior existence.
- The only meaningful failure is `401 invalid_client` (bad client authentication);
  `400 unsupported_token_type` if the type cannot be revoked here.

## Downstream introspection after revocation

```jsonc
{
  "active": false   // the cascaded access token now reads inactive; the API's
                    // next introspection turns the resource call into a 401.
}
```

Revoking the refresh token `rt.8f3c1d9a-family-01` cascaded to the access token
`mF_9.B5f-4.1JqM` (same token family). A resource server validating via
[introspection](../../token-introspection/README.md) sees the effect immediately; a
server validating a self-contained JWT locally would keep honoring it until `exp`.

> **Synthetic-data note:** every token, id, and secret in this folder is fabricated
> for documentation and is not valid at any real authorization server.
