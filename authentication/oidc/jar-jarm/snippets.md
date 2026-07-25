---
title: "JAR / JARM — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9101"
---

# JAR / JARM — Client Snippets

Runnable client snippets for JWT-Secured Authorization Request (JAR, RFC 9101) and
the JWT-secured authorization response mode (JARM). Every value is **synthetic and
sanitized** — the request object, the JARM response JWT, hosts, and `code` are all
fabricated and will not verify or redeem against a real authorization server.
Replace `PLACEHOLDER` values.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `as.example.com` | OpenID Provider |
| `s6bhdrkqt3` | `client_id` with a registered signing `jwks` / `jwks_uri` |
| `client.example.com/cb` | Registered `redirect_uri` |

## Step 1 — Build and sign the request object (JAR)

The authorization parameters become claims in a JWT signed with the client's key
(`typ` = `oauth-authz-req+jwt`). Illustrative signing:

```javascript
// npm i jose  — synthetic keys/values, illustrative only.
import { SignJWT, importPKCS8 } from "jose";

const key = await importPKCS8(process.env.CLIENT_PRIVATE_KEY_PEM, "RS256");
const requestObject = await new SignJWT({
  response_type: "code",
  client_id: "s6bhdrkqt3",
  redirect_uri: "https://client.example.com/cb",
  scope: "openid profile",
  state: "af0ifjsldkj",
  nonce: "n-0S6_WzA2Mj",
  code_challenge: "K2-ltc83acc4h0c9w6ESC_rEMTJ3bwc-uCHaoeK1t8U",
  code_challenge_method: "S256",
  response_mode: "jwt", // ask for a JARM response
})
  .setProtectedHeader({ alg: "RS256", typ: "oauth-authz-req+jwt", kid: "client-sig-1" })
  .setIssuer("s6bhdrkqt3")
  .setAudience("https://as.example.com")
  .setIssuedAt()
  .setExpirationTime("5m")
  .sign(key);
```

The resulting synthetic request object (JWT):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6Im9hdXRoLWF1dGh6LXJlcStqd3QiLCJraWQiOiJjbGllbnQtc2lnLTEifQ.eyJpc3MiOiJzNmJoZHJrcXQzIiwiYXVkIjoiaHR0cHM6Ly9hcy5leGFtcGxlLmNvbSIsInJlc3BvbnNlX3R5cGUiOiJjb2RlIiwiY2xpZW50X2lkIjoiczZiaGRya3F0MyIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vY2xpZW50LmV4YW1wbGUuY29tL2NiIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSIsInN0YXRlIjoiYWYwaWZqc2xka2oiLCJub25jZSI6Im4tMFM2X1d6QTJNaiIsImNvZGVfY2hhbGxlbmdlIjoiSzItbHRjODNhY2M0aDBjOXc2RVNDX3JFTVRKM2J3Yy11Q0hhb2VLMXQ4VSIsImNvZGVfY2hhbGxlbmdlX21ldGhvZCI6IlMyNTYiLCJyZXNwb25zZV9tb2RlIjoiand0IiwiZXhwIjoxNzc0MDAwMzAwLCJpYXQiOjE3NzQwMDAwMDB9.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef
```

## Step 2 — JAR by value: send it in the `request` parameter

`client_id` and `response_type` stay as plain query params so the AS can route.

```bash
curl -sS -i -G https://as.example.com/authorize \
  --data-urlencode "client_id=s6bhdrkqt3" \
  --data-urlencode "response_type=code" \
  --data-urlencode "request=PLACEHOLDER_REQUEST_OBJECT_JWT"
# Browser would follow this; the AS verifies the request-object signature first.
```

## Step 2b — JAR by reference: `request_uri`

The AS dereferences the URI to fetch the signed request object (often a one-time
PAR `request_uri`).

```bash
curl -sS -i -G https://as.example.com/authorize \
  --data-urlencode "client_id=s6bhdrkqt3" \
  --data-urlencode "response_type=code" \
  --data-urlencode "request_uri=https://client.example.com/req/abc123"
```

## Step 3 — The JARM response

Because `response_mode=jwt` was requested, the AS returns the response parameters
inside a signed JWT in the `response` query parameter:

```
HTTP/1.1 302 Found
Location: https://client.example.com/cb?response=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFzLXNpZy0yMDI2LTAxIn0.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwiYXVkIjoiczZiaGRya3F0MyIsImV4cCI6MTc3NDAwMDEyMCwiY29kZSI6IlNwbHhsT0JlWlFRWWJZUzZXeFNiSUEiLCJzdGF0ZSI6ImFmMGlmanNsZGtqIn0.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef
```

The client MUST verify the JARM signature and check `iss` (the AS that answered —
mix-up defense) and `aud` (= its `client_id`) **before** trusting `code`:

```javascript
import { jwtVerify, createRemoteJWKSet } from "jose";

const jwks = createRemoteJWKSet(new URL("https://as.example.com/jwks"));
const url = new URL(redirectLocation);
const { payload } = await jwtVerify(url.searchParams.get("response"), jwks, {
  issuer: "https://as.example.com",  // must match the AS you sent to
  audience: "s6bhdrkqt3",
});
const code = payload.code; // only now is `code` trustworthy
```

## Step 4 — Redeem the code at the token endpoint

```bash
curl -sS -X POST https://as.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=SplxlOBeZQQYbYS6WxSbIA" \
  -d "redirect_uri=https://client.example.com/cb" \
  -d "client_id=s6bhdrkqt3" \
  -d "code_verifier=PLACEHOLDER_PKCE_VERIFIER"
```

## Error cases

```
# Tampered request object -> AS rejects before acting
302 https://client.example.com/cb?error=invalid_request_object

# Bad-signature / wrong-iss JARM response -> client discards, does NOT redeem code
```

## Synthetic-data note

The request object, JARM response JWT, `code`, and PKCE values are fabricated. Both
JWT signature segments are the literal placeholder
`c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...` and will not verify. Never paste a real
private key or live authorization code into these files.
