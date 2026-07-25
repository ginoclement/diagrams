---
title: "Mutual TLS (mTLS) Client-Certificate Authentication — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# Mutual TLS (mTLS) Client-Certificate Authentication — DevTools Walkthrough

How to "read" mTLS auth — and why most of it is **not** in the Network tab. All
values are **synthetic**.

## The key point: the client cert is NOT visible in the Network tab

The **Network** tab shows HTTP: methods, URLs, headers, bodies, cookies. But mTLS
authentication happens **inside the TLS handshake**, one layer below HTTP. There is
**no request row, no header, and no cookie** carrying the client certificate — by the
time the browser shows you `GET /orders`, the handshake (including
`CertificateRequest`, the client `Certificate`, and `CertificateVerify`) is already
finished. So:

- You will **not** find an `Authorization` header or any credential in the request.
- In TLS 1.3 the client certificate is sent **after** encryption is established, so
  it is not even visible to a passive packet sniffer (it was in TLS 1.2).

## Where to actually see it

1. **Browser Security panel** (Chrome DevTools → **Security** tab):
   - Select the origin → **View certificate** shows the **server** cert. The
     **client** cert the browser chose is surfaced via the OS/browser cert-selection
     prompt, not a Network row. Chrome logs client-cert selection under
     `chrome://net-export` (capture a NetLog, then inspect the
     `SSL_HANDSHAKE` / `CERT_VERIFIER` events).

2. **`openssl s_client`** — the clearest view of the handshake:
   ```bash
   openssl s_client -connect api.internal.example.com:443 \
     -cert client.crt -key client.key -CAfile ca.crt -tls1_3 </dev/null \
     | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
   ```
   This prints the certificate chain exchanged, the negotiated TLS version, and lets
   you inspect the client cert's **subject**, **issuer**, **validity**, and **SAN**
   (the fields the server maps to an identity).

3. **When a reverse proxy terminates mTLS**, the *verified* cert details are commonly
   forwarded to the backend as HTTP headers (e.g. `X-SSL-Client-S-DN`,
   `X-SSL-Client-Verify`, `X-SSL-Client-Cert`). **Those** are visible in the Network
   tab *between the proxy and the app* — and they are exactly the
   [header-based-sso](../header-based-sso/README.md) trust-boundary problem: the app
   must only accept them from the proxy.

## What you can observe at the HTTP layer

| Signal | Where |
|---|---|
| The application request over the mTLS connection | Network → the `GET /orders` row (no credential header on it) |
| Server cert | DevTools → Security → View certificate |
| Client cert subject/issuer/SAN/validity | `openssl s_client` / `openssl x509` (terminal) |
| Handshake events (client-cert selection) | `chrome://net-export` NetLog |
| Proxy-forwarded verified-cert headers (if TLS terminated at a proxy) | Network → request headers *on the proxy→app hop* |

See [samples/README.md](./samples/README.md) for a HAR of the application request
plus the decoded client-certificate fields (from `openssl`).
