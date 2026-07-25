---
title: "OAuth 2.0 Token Introspection (RFC 7662) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7662"
---

# OAuth 2.0 Token Introspection (RFC 7662) — Sample Capture

Sanitized, **synthetic** capture artifacts for the introspection flow.

- [token-introspection.har](./token-introspection.har) — HAR 1.2 with two entries:
  the browser-visible `GET /resource` and the back-channel `POST /introspect`.

All values are fabricated. The access token `mF_9.B5f-4.1JqM` is opaque (not a JWT),
so it decodes to nothing on its own — its meaning comes only from the introspection
response below.

## Annotated introspection response (`active: true`)

```jsonc
{
  "active": true,                       // canonical verdict: token is live
  "scope": "read:orders",               // space-delimited granted scopes
  "client_id": "s6BhdRkqt3",            // client that originally obtained the token
  "username": "avery.diaz",             // human-readable subject label
  "token_type": "Bearer",              // how the token is presented
  "sub": "248289761001",                // stable subject identifier
  "aud": "https://api.example.com",     // intended audience — API must match this
  "iss": "https://as.example.com",      // issuing authorization server
  "exp": 1774000000,                    // expiry, UNIX secs -> 2026-03-17T13:46:40Z
  "iat": 1773996400,                    // issued-at, UNIX secs -> 2026-03-17T12:46:40Z
  "jti": "atk-7c1f9a2b",                // unique token id (for correlation/audit)
  "cnf": {                              // confirmation: token is sender-constrained
    "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I"  // DPoP JWK SHA-256 thumbprint
  }
}
```

Enforcement checklist the resource server runs against the above:

1. `active === true` — else reject `401 invalid_token`.
2. `aud === "https://api.example.com"` — reject a token minted for another API.
3. required scope (`read:orders`) present in `scope`.
4. `exp` in the future (convert: `date -u -d @1774000000`).
5. `cnf.jkt` present → also verify the presented DPoP proof's key thumbprint
   matches. See [DPoP](../../dpop/README.md).

## Annotated introspection response (`active: false`)

```jsonc
{
  "active": false   // ONLY this field. No scope/sub/exp — never leak an inactive
                    // or foreign token's claims (RFC 7662 §2.2).
}
```

A token returns `active:false` when it is expired, revoked (see
[Token Revocation](../../token-revocation/README.md)), unknown, or not valid for
this caller. The API cannot tell which — and should not need to.

> **Synthetic-data note:** every token, id, secret, subject, thumbprint, and
> timestamp in this folder is fabricated for documentation. Nothing here is valid
> at any real authorization server.
