---
title: "Dynamic Client Registration — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7591, RFC 7592"
---

# Dynamic Client Registration — Client Snippets

Runnable client snippets for OAuth 2.0 Dynamic Client Registration (RFC 7591) and
management (RFC 7592). Every value is **synthetic and sanitized** — hosts,
`client_id`, secrets, and the `registration_access_token` are fabricated and will
not work against a real authorization server. Replace `PLACEHOLDER` values.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `as.example.com` | Authorization server exposing `registration_endpoint` |
| `PLACEHOLDER_INITIAL_AT` | Initial access token (protected registration only) |
| `PLACEHOLDER_REG_AT` | Per-client `registration_access_token` returned at registration |
| `PLACEHOLDER_REG_URI` | Per-client `registration_client_uri` returned at registration |

## Step 1 — Open registration (`POST /register`)

The client POSTs a JSON `client_metadata` document. The AS replies `201 Created`.

```bash
curl -sS \
  -X POST https://as.example.com/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Synthetic Sample App",
    "redirect_uris": ["https://client.example.com/cb"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "client_secret_basic",
    "scope": "openid profile",
    "contacts": ["dev@client.example.com"]
  }'
```

Synthetic `201 Created` response:

```json
{
  "client_id": "s6bhdrkqt3",
  "client_secret": "SYNTH_cGE5c2VjcmV0X2RvX25vdF91c2U",
  "client_id_issued_at": 1774000000,
  "client_secret_expires_at": 1805536000,
  "registration_access_token": "SYNTH_reg_at_2Yotnf9Xz_do_not_use",
  "registration_client_uri": "https://as.example.com/register/s6bhdrkqt3",
  "redirect_uris": ["https://client.example.com/cb"],
  "grant_types": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_method": "client_secret_basic"
}
```

## Step 2 — Protected registration with a software statement

The request carries an initial access token and a signed `software_statement`
(JWT) whose claims override the plain JSON.

```bash
curl -sS \
  -X POST https://as.example.com/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PLACEHOLDER_INITIAL_AT" \
  -d '{
    "client_name": "Synthetic Sample App",
    "software_statement": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRpcmVjdG9yeS0yMDI2In0.eyJpc3MiOiJodHRwczovL2RpcmVjdG9yeS5leGFtcGxlLWZlZGVyYXRpb24ub3JnIiwiaWF0IjoxNzc0MDAwMDAwLCJleHAiOjE4MDU1MzYwMDAsInNvZnR3YXJlX2lkIjoiNE5SQjEtMFhaQUJaSTlFNi01U00zUiIsInNvZnR3YXJlX2NsaWVudF9uYW1lIjoiU3ludGhldGljIFNhbXBsZSBBcHAiLCJyZWRpcmVjdF91cmlzIjpbImh0dHBzOi8vY2xpZW50LmV4YW1wbGUuY29tL2NiIl0sImdyYW50X3R5cGVzIjpbImF1dGhvcml6YXRpb25fY29kZSIsInJlZnJlc2hfdG9rZW4iXSwidG9rZW5fZW5kcG9pbnRfYXV0aF9tZXRob2QiOiJwcml2YXRlX2tleV9qd3QifQ.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef"
  }'
```

## Step 3 — Read current config (RFC 7592 `GET`)

```bash
curl -sS \
  https://as.example.com/register/s6bhdrkqt3 \
  -H "Authorization: Bearer PLACEHOLDER_REG_AT"
```

## Step 4 — Update metadata (RFC 7592 `PUT`)

Send the **full** updated metadata; the AS may return a new
`registration_access_token`.

```bash
curl -sS \
  -X PUT https://as.example.com/register/s6bhdrkqt3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PLACEHOLDER_REG_AT" \
  -d '{
    "client_id": "s6bhdrkqt3",
    "client_name": "Synthetic Sample App (renamed)",
    "redirect_uris": ["https://client.example.com/cb", "https://client.example.com/cb2"],
    "grant_types": ["authorization_code", "refresh_token"],
    "token_endpoint_auth_method": "client_secret_basic"
  }'
```

## Step 5 — Deregister (RFC 7592 `DELETE`)

```bash
curl -sS -i \
  -X DELETE https://as.example.com/register/s6bhdrkqt3 \
  -H "Authorization: Bearer PLACEHOLDER_REG_AT"
# -> HTTP/1.1 204 No Content
```

## Error cases

```bash
# Bad redirect_uris -> 400 invalid_redirect_uri
curl -sS -X POST https://as.example.com/register \
  -H "Content-Type: application/json" \
  -d '{"redirect_uris":["http://evil.example/inject"]}'
# -> 400 {"error":"invalid_redirect_uri"}

# Stale / stolen registration_access_token -> 401
curl -sS -i -X PUT https://as.example.com/register/s6bhdrkqt3 \
  -H "Authorization: Bearer EXPIRED_REG_AT" \
  -H "Content-Type: application/json" -d '{"client_id":"s6bhdrkqt3"}'
# -> 401 Unauthorized
```

## SDK example (Node.js)

```javascript
// Built-in fetch (Node 18+). Synthetic values — replace before use.
const AS = "https://as.example.com";

// Register.
const reg = await fetch(`${AS}/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    client_name: "Synthetic Sample App",
    redirect_uris: ["https://client.example.com/cb"],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_basic",
    scope: "openid profile",
  }),
});
const client = await reg.json(); // { client_id, client_secret, registration_access_token, registration_client_uri, ... }

// Later: read the record back (RFC 7592).
const current = await fetch(client.registration_client_uri, {
  headers: { authorization: `Bearer ${client.registration_access_token}` },
});
console.log(reg.status, await current.json());
```

## Synthetic-data note

All `client_id`, `client_secret`, `registration_access_token`, and
`software_statement` values are fabricated. The software statement's signature is a
placeholder and will not verify. Never commit a real client secret or registration
access token.
