---
title: "mTLS Client Auth and Certificate-Bound Tokens — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# mTLS Client Auth and Certificate-Bound Tokens — Client Snippets

Runnable client snippets for OAuth 2.0 mutual-TLS client authentication and
certificate-bound access tokens (RFC 8705). Every value below is **synthetic and
sanitized** — the hosts, `client_id`, certificate thumbprint, and tokens are fake
and will not authenticate against any real authorization server. Replace the
`PLACEHOLDER` values with your own.

The distinguishing feature of this flow is that the client's **X.509 certificate is
the credential**: it is presented during the TLS handshake (`--cert` / `--key`),
there is no `client_secret`, and the issued access token carries a confirmation
claim `cnf.x5t#S256` that binds it to that certificate.

## Placeholders

| Placeholder | Meaning |
|---|---|
| `client.crt` / `client.key` | The client's X.509 leaf cert and private key (PEM) |
| `s6bhdrkqt3` | `client_id` registered with an expected cert subject/SAN or JWKS thumbprint |
| `as.mtls.example.com` | mTLS alias host from `mtls_endpoint_aliases` metadata |
| `api.example.com` | Resource server that enforces the `cnf` binding |

## Step 1 — Client-cert mTLS call to the token endpoint

The TLS handshake itself carries the client certificate; no `client_secret` is
sent. This is `grant_type=client_credentials` in the workload case.

```bash
curl -sS \
  --cert ./client.crt --key ./client.key \
  -X POST https://as.mtls.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=s6bhdrkqt3" \
  -d "scope=accounts"
```

Synthetic response (`cnf.x5t#S256` is the base64url SHA-256 of the leaf cert):

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6ImFzLXNpZy0yMDI2LTAxIn0.eyJpc3MiOiJodHRwczovL2FzLmV4YW1wbGUuY29tIiwiYXVkIjoiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJzdWIiOiJzNmJoZHJrcXQzLWNsaWVudCIsImNsaWVudF9pZCI6InM2YmhkcmtxdDMiLCJzY29wZSI6ImFjY291bnRzIiwiaWF0IjoxNzc0MDAwMDAwLCJleHAiOjE3NzQwMDM2MDAsImp0aSI6IjZmMmExYzllLXN5bnRoZXRpYyIsImNuZiI6eyJ4NXQjUzI1NiI6ImJ3Y0swZXNjM0FDQzNEQjJZNV9sRVNzWEU4dTlpZS1ta0RzNUNkckVJWVkifX0.c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_do_not_verify_0123456789abcdef",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts"
}
```

## Step 2 — Call the API presenting the SAME client certificate

The resource server recomputes `x5t#S256` over the presented leaf cert and compares
it to the token's `cnf.x5t#S256`. Same cert as Step 1 → match → served.

```bash
curl -sS \
  --cert ./client.crt --key ./client.key \
  https://api.example.com/accounts \
  -H "Authorization: Bearer PLACEHOLDER_ACCESS_TOKEN"
```

## Step 3 — Replay on an unbound connection (must fail)

Same token, but **no** client cert (or a different one). The thumbprint no longer
matches `cnf.x5t#S256`, so the API rejects it — this is the whole point of binding.

```bash
# No --cert / --key: bearer token alone is not enough
curl -sS -i \
  https://api.example.com/accounts \
  -H "Authorization: Bearer PLACEHOLDER_ACCESS_TOKEN"
# -> HTTP/1.1 401 Unauthorized
# -> WWW-Authenticate: Bearer error="invalid_token",
#      error_description="certificate thumbprint mismatch"
```

## Step 4 — `self_signed_tls_client_auth` variant

Identical call shape; the only difference is registration: the AS matches
`SHA-256(cert)` against a key in the client's registered `jwks` / `jwks_uri`
instead of validating a CA chain. No CA is involved.

```bash
curl -sS \
  --cert ./self-signed-client.crt --key ./self-signed-client.key \
  -X POST https://as.mtls.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=s6bhdrkqt3" \
  -d "scope=accounts"
```

## Step 5 — Introspection of a bound (opaque) token

A resource server holding an opaque token asks the AS for its `cnf`, then
bind-checks locally.

```bash
curl -sS \
  --cert ./api.crt --key ./api.key \
  -X POST https://as.mtls.example.com/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=PLACEHOLDER_OPAQUE_TOKEN"
# -> { "active": true, "cnf": { "x5t#S256": "bwcK0esc3ACC3DB2Y5_lESsXE8u9ie-mkDs5CdrEIYY" }, ... }
```

## SDK example (Node.js)

Uses a single mTLS `https.Agent` for both the token call and the API call, so the
same client certificate is presented on every connection.

```javascript
// npm i undici  — or use built-in fetch with an https.Agent via node:https
import { Agent, request } from "undici";
import { readFileSync } from "node:fs";

// Synthetic paths / values — replace with your own.
const agent = new Agent({
  connect: {
    cert: readFileSync("./client.crt"),
    key: readFileSync("./client.key"),
  },
});

// Step 1: mTLS token request (cert is the credential; no client_secret).
const tokenRes = await request("https://as.mtls.example.com/token", {
  method: "POST",
  dispatcher: agent,
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: "s6bhdrkqt3",
    scope: "accounts",
  }).toString(),
});
const { access_token } = await tokenRes.body.json();

// Step 2: call the API on a connection presenting the SAME cert.
const apiRes = await request("https://api.example.com/accounts", {
  dispatcher: agent, // same cert -> thumbprint matches token cnf.x5t#S256
  headers: { authorization: `Bearer ${access_token}` },
});
console.log(apiRes.statusCode, await apiRes.body.json());
```

## Synthetic-data note

All tokens, thumbprints, hostnames, and certificate filenames here are fabricated
for documentation. The JWT signature segment is the literal placeholder
`c0ffee_SYNTHETIC_SIGNATURE_NOT_REAL_...` and will not verify. Never paste a real
private key, client certificate, or access token into these files.
