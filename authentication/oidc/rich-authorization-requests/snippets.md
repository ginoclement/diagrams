---
title: "Rich Authorization Requests — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9396"
---

# Rich Authorization Requests — Client Snippets

Runnable client snippets for Rich Authorization Requests (RAR, RFC 9396). Every
value is **synthetic and sanitized** — hosts, `client_id`, the `code`, tokens, and
the IBAN/account values are fabricated and will not authorize against any real
system. Replace `PLACEHOLDER` values.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `as.example.com` | OpenID Provider advertising `authorization_details_types_supported` |
| `api.example.com` | Resource server enforcing granted `authorization_details` |
| `s6bhdrkqt3` | `client_id` |

## The `authorization_details` payload

A JSON array of fine-grained authorization objects. This one requests a single
payment initiation:

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

## Step 1 — Send `authorization_details` at `/authorize`

Because the payload is large and sensitive, carry it inside a signed request object
(see [JAR/JARM](../jar-jarm/README.md)) or push it via
[PAR](../pushed-authorization-requests/README.md). Shown here URL-encoded for
clarity:

```bash
AUTHZ_DETAILS='[{"type":"payment_initiation","locations":["https://api.example.com/payments"],"actions":["initiate"],"instructedAmount":{"currency":"EUR","amount":"123.45"},"creditorAccount":{"iban":"DE02100100109307118603"}}]'

curl -sS -i -G https://as.example.com/authorize \
  --data-urlencode "client_id=s6bhdrkqt3" \
  --data-urlencode "response_type=code" \
  --data-urlencode "redirect_uri=https://client.example.com/cb" \
  --data-urlencode "scope=openid" \
  --data-urlencode "state=af0ifjsldkj" \
  --data-urlencode "authorization_details=${AUTHZ_DETAILS}"
# The AS validates each object against its registered type schema and renders
# consent showing the exact amount, creditor, and action.
```

## Step 2 — Redeem the code; read back the GRANTED details

The token response echoes `authorization_details` as actually granted — which may
be a subset of what was requested. The client MUST read these, not assume the
request was granted verbatim.

```bash
curl -sS -X POST https://as.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=SplxlOBeZQQYbYS6WxSbIA" \
  -d "redirect_uri=https://client.example.com/cb" \
  -d "client_id=s6bhdrkqt3"
```

Synthetic token response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6ImFzLXNpZy0yMDI2LTAxIn0.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwiYXVkIjoiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJzdWIiOiIyNDgyODk3NjEwMDEiLCJjbGllbnRfaWQiOiJzNmJoZHJrcXQzIiwiaWF0IjoxNzc0MDAwMDAwLCJleHAiOjE3NzQwMDM2MDAsImp0aSI6InJhci05YThiLXN5bnRoZXRpYyIsImF1dGhvcml6YXRpb25fZGV0YWlscyI6W3sidHlwZSI6InBheW1lbnRfaW5pdGlhdGlvbiIsImxvY2F0aW9ucyI6WyJodHRwczovL2FwaS5leGFtcGxlLmNvbS9wYXltZW50cyJdLCJhY3Rpb25zIjpbImluaXRpYXRlIl0sImluc3RydWN0ZWRBbW91bnQiOnsiY3VycmVuY3kiOiJFVVIiLCJhbW91bnQiOiIxMjMuNDUifSwiY3JlZGl0b3JBY2NvdW50Ijp7ImliYW4iOiJERTAyMTAwMTAwMTA5MzA3MTE4NjAzIn19XX0.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef",
  "token_type": "Bearer",
  "expires_in": 3600,
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

## Step 3 — Call the API within the granted detail

```bash
curl -sS -X POST https://api.example.com/payments \
  -H "Authorization: Bearer PLACEHOLDER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"instructedAmount":{"currency":"EUR","amount":"123.45"},"creditorAccount":{"iban":"DE02100100109307118603"}}'
# -> 201 Created (location + action + amount all within the granted detail)
```

## Error / variant cases

```bash
# Use outside the granted locations/actions -> 403
curl -sS -i https://api.example.com/accounts \
  -H "Authorization: Bearer PLACEHOLDER_PAYMENTS_ONLY_TOKEN"
# -> 403 {"error":"insufficient_authorization"}

# Unknown / malformed type at /authorize -> invalid_authorization_details
#   authorization_details=[{"type":"bogus"}]
# -> 302 https://client.example.com/cb?error=invalid_authorization_details
```

## SDK example (Node.js)

```javascript
// Built-in fetch (Node 18+). Synthetic values — replace before use.
const AS = "https://as.example.com";

const authorizationDetails = [
  {
    type: "payment_initiation",
    locations: ["https://api.example.com/payments"],
    actions: ["initiate"],
    instructedAmount: { currency: "EUR", amount: "123.45" },
    creditorAccount: { iban: "DE02100100109307118603" },
  },
];

// Build the /authorize URL (best pushed via PAR or wrapped in a request object).
const authorizeUrl = new URL(`${AS}/authorize`);
authorizeUrl.search = new URLSearchParams({
  client_id: "s6bhdrkqt3",
  response_type: "code",
  redirect_uri: "https://client.example.com/cb",
  scope: "openid",
  state: "af0ifjsldkj",
  authorization_details: JSON.stringify(authorizationDetails),
}).toString();

// After redirect + consent, redeem the code and read the GRANTED details.
const tok = await fetch(`${AS}/token`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: "SplxlOBeZQQYbYS6WxSbIA",
    redirect_uri: "https://client.example.com/cb",
    client_id: "s6bhdrkqt3",
  }).toString(),
});
const json = await tok.json();
// CRITICAL: granted details may be a downscoped subset of the request.
const granted = json.authorization_details;
console.log(granted);
```

## Synthetic-data note

The IBAN, account IDs, amounts, `code`, and tokens are fabricated. The access
token's signature is a placeholder and will not verify. Never place real financial
account data or live tokens in these files.
