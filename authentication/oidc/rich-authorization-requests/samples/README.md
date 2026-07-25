---
title: "Rich Authorization Requests — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9396"
---

# Rich Authorization Requests — Sample Capture

Synthetic, sanitized artifacts for the RAR flow. The IBAN, account, amount, `code`,
and tokens are fabricated; the access-token signature is the placeholder
`c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...` and will not verify.

- Capture: [`rich-authorization-requests.har`](./rich-authorization-requests.har) (HAR 1.2)

## Entries in the capture

1. `GET /authorize` with `authorization_details` → `302` with `code`.
2. `POST /token` → `200` echoing the **granted** `authorization_details`.
3. `POST /payments` within the granted detail → `201`.
4. `GET /accounts` outside the grant → `403 insufficient_authorization`.

## Requested `authorization_details` (on `/authorize`)

```json
[
  {
    "type": "payment_initiation",
    "locations": ["https://api.example.com/payments"],
    "actions": ["initiate"],
    "instructedAmount": { "currency": "EUR", "amount": "123.45" },
    "creditorAccount": { "iban": "DE02100100109307118603" }
  }
]
```

## Decoded access token (from the token response)

Header:

```json
{ "alg": "RS256", "typ": "at+jwt", "kid": "as-sig-2026-01" }
```

Payload:

```json
{
  "iss": "https://as.example.com",
  "aud": "https://api.example.com",
  "sub": "248289761001",
  "client_id": "s6bhdrkqt3",
  "iat": 1774000000,
  "exp": 1774003600,
  "jti": "rar-9a8b-synthetic",
  "authorization_details": [
    {
      "type": "payment_initiation",
      "locations": ["https://api.example.com/payments"],
      "actions": ["initiate"],
      "instructedAmount": { "currency": "EUR", "amount": "123.45" },
      "creditorAccount": { "iban": "DE02100100109307118603" }
    }
  ]
}
```

## Annotated fields

| Field | Meaning |
|---|---|
| `authorization_details` | The **granted** fine-grained authorization; authoritative over the request |
| `type` | `payment_initiation` — an AS-defined schema advertised in `authorization_details_types_supported` |
| `locations` | Resource server URIs the authorization applies to (enforced by the API) |
| `actions` | Permitted actions (`initiate`) |
| `instructedAmount` / `creditorAccount` | Type-specific constraints binding the token to this exact transaction |

Here the granted set equals the request (full grant). Under a partial grant it
would be a narrower subset, and the client must read this claim rather than assume
the request succeeded verbatim. The API's `403` in entry 4 shows enforcement of
`locations` — `/accounts` is outside the granted `/payments` location.

## Synthetic-data note

All financial values, accounts, and tokens are fabricated for documentation. Never
substitute real account data or live tokens.
