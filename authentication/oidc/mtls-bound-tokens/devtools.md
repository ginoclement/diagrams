---
title: "mTLS Client Auth and Certificate-Bound Tokens — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# mTLS Client Auth and Certificate-Bound Tokens — DevTools Walkthrough

How to read a certificate-bound-token exchange in a network capture. Because mTLS
happens in the **TLS handshake**, browser DevTools cannot show the client
certificate itself — you observe it through a proxy that performs client-cert
auth, or via a CLI/tooling capture. What you *can* always inspect is the issued
token's `cnf.x5t#S256` claim and the API's accept/reject behavior.

All values referenced below are **synthetic** (see [samples/](./samples/README.md)).

## Observable requests, in order

1. **`POST https://as.mtls.example.com/token`** — the mTLS token request.
   - Note this hits the **mTLS alias host** (`mtls_endpoint_aliases`), not the main
     issuer host. There is **no `client_secret`** in the body and no
     `Authorization` header — the credential is the TLS client certificate.
   - Body: `grant_type=client_credentials&client_id=...&scope=...`.
   - In the TLS details (proxy view), confirm a **Certificate** message was sent by
     the client during the handshake.

2. **`200` token response** — decode the `access_token`.
   - Split the JWT on `.`; base64url-decode the payload.
   - The binding lives in `cnf`: look for `"cnf": { "x5t#S256": "<thumbprint>" }`.
     That value is `base64url(SHA-256(DER(leaf cert)))`.
   - Verify it matches the client cert you presented:
     `openssl x509 -in client.crt -outform DER | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='`.

3. **`GET https://api.example.com/accounts`** (with the bound cert) — the success
   call.
   - Response `200`. The resource server has recomputed the thumbprint over the
     presented cert and matched it against `cnf.x5t#S256`.
   - If a TLS-terminating proxy fronts the API, look for the forwarded verified-cert
     header (e.g. `X-Client-Cert` / `X-SSL-Client-Cert`) the proxy injects — that is
     what the API bind-checks against.

4. **`GET https://api.example.com/accounts`** (no cert / different cert) — the
   replay that must fail.
   - Response `401` with `WWW-Authenticate: Bearer error="invalid_token"`.
   - This is the key observation: the **same token** succeeds on the bound
     connection and fails on an unbound one. Bearer theft alone is useless.

5. **`POST https://as.mtls.example.com/introspect`** (optional) — for opaque bound
   tokens.
   - The `200` body returns `cnf.x5t#S256`; the resource server compares it to the
     cert on the current connection.

## What to decode

| Artifact | Where | How to read it |
|---|---|---|
| `access_token` payload | Step 2 response body | base64url-decode; inspect `cnf.x5t#S256` |
| Cert thumbprint | your `client.crt` | `openssl` pipeline above; must equal `cnf.x5t#S256` |
| `401` challenge | Step 4 response header | `WWW-Authenticate: Bearer error="invalid_token"` |
| Introspection `cnf` | Step 5 response body | confirms binding for opaque tokens |

## Note

TLS client certificates are not visible in ordinary browser DevTools; use a
capturing proxy or CLI (`curl -v --cert ...`) to observe the handshake. All sample
material is synthetic.
