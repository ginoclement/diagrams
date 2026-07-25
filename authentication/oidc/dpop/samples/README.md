---
title: "DPoP — Demonstrating Proof of Possession (RFC 9449) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9449"
---

# DPoP — Demonstrating Proof of Possession (RFC 9449) — Sample Capture

Sanitized, **synthetic** capture artifacts for the DPoP flow.

- [dpop.har](./dpop.har) — HAR 1.2 with three entries: the `POST /token` with a proof,
  the `GET /resource` with a proof + `ath`, and a `use_dpop_nonce` challenge.

The proof JWTs' header and payload segments are genuine base64url and decode to the
JSON below; the signature segment is a placeholder and will not verify.

## Decoded token-endpoint proof (`DPoP` header on `POST /token`)

**Header**

```jsonc
{
  "typ": "dpop+jwt",
  "alg": "ES256",
  "jwk": {                    // PUBLIC key only; the AS hashes this to get jkt
    "kty": "EC",
    "crv": "P-256",
    "x": "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
    "y": "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA"
  }
}
```

**Payload**

```jsonc
{
  "jti": "proof-e1b2c3d4",                 // unique id; server tracks it to block replay
  "htm": "POST",                           // must equal the request method
  "htu": "https://as.example.com/token",   // must equal the request URI (no query)
  "iat": 1774000000                        // 2026-03-17T13:46:40Z; tight freshness window
}
```

No `ath` here — there is no access token to hash yet.

## Bound token

The response is `token_type: DPoP` and the issued access token is bound to the key:

```jsonc
{
  "cnf": {
    "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I"  // SHA-256 thumbprint of the jwk above
  }
}
```

## Decoded resource-endpoint proof (`DPoP` header on `GET /resource`)

**Header** — identical (same `jwk`).

**Payload**

```jsonc
{
  "jti": "proof-a9f8e7d6",                     // DIFFERENT jti from the token-endpoint proof
  "htm": "GET",                                // matches the resource request method
  "htu": "https://api.example.com/resource",   // matches the resource URI
  "iat": 1774000100,                           // 2026-03-17T13:48:20Z; fresh
  "ath": "fUHyO2r2Z3DZ53EsNrWBb0xWXoaNy59IiKCAqksmQEo"  // base64url(SHA-256(access_token))
}
```

The token is presented as `Authorization: DPoP mF_9.B5f-4.1JqM` (NOT `Bearer`). The
resource server verifies, in one shot:

1. the proof signature (against the embedded `jwk`),
2. `jkt(jwk)` == the token's `cnf.jkt`,
3. `ath` == base64url(SHA-256(access_token)),
4. `htm`/`htu` match this request,
5. `jti` is fresh (not replayed) and `iat` is within the window.

A stolen token replayed as plain `Bearer`, or with a proof signed by a different key,
fails check 1/2 → `401 invalid_token`.

## Nonce challenge

```http
HTTP/1.1 400 Bad Request
DPoP-Nonce: eyJ7S_zG.ewauwAF.n-0S6

{ "error": "use_dpop_nonce" }
```

The client copies the `DPoP-Nonce` value into a `nonce` claim on a rebuilt proof and
retries. This closes the pre-generated-proof gap.

> **Synthetic-data note:** the key material, proofs, thumbprints, tokens, codes, and
> nonces here are fabricated for documentation. The proofs are unsigned in any
> meaningful sense and will not verify against any real DPoP implementation.
