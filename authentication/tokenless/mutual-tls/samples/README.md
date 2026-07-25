---
title: "Mutual TLS (mTLS) Client-Certificate Authentication — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# Mutual TLS (mTLS) Client-Certificate Authentication — Sample Capture

A sanitized HAR of the application request over an mTLS connection, plus the decoded
client-certificate fields. **All values are synthetic** — a self-signed lab PKI, not
a real certificate.

- Capture: [mutual-tls.har](./mutual-tls.har) (HAR 1.2)

## Reminder: the credential is not in the HAR

The client certificate is exchanged in the **TLS handshake**, below HTTP, so the
`GET /orders` request carries **no credential header**. The HAR includes a
non-standard `_securityDetails` extension field on that entry to *document* the
handshake — browsers do not actually expose this in the Network tab (see
[../devtools.md](../devtools.md)).

## The client certificate, decoded (via `openssl x509`)

```bash
openssl x509 -in client.crt -noout -subject -issuer -dates -ext subjectAltName,extendedKeyUsage
```

| Field | Value | Why the server checks it |
|---|---|---|
| Subject | `CN=svc-orders, O=Example, OU=payments` | Mapped to an application identity (never trust CN display alone) |
| Issuer | `CN=Synthetic Test CA` | Must chain to a **pinned/trusted** CA to prevent cross-CA impersonation |
| Not Before | `2026-07-25T00:00:00Z` | Validity window start |
| Not After | `2026-10-23T00:00:00Z` | Short-lived (90 days); prefer automated rotation (e.g. SPIFFE SVIDs) |
| SAN (URI) | `spiffe://example.com/ns/pay/sa/orders` | The SPIFFE ID — the deliberate identity mapping |
| Extended Key Usage | `clientAuth` | Must be present for a client certificate |
| Revocation | (OCSP/CRL) | Checked separately; decide soft-fail vs hard-fail explicitly |

## Proxy-forwarded verified-cert headers (2nd HAR entry)

When a reverse proxy terminates TLS, it forwards the *verified* result to the backend:

```
X-SSL-Client-Verify: SUCCESS
X-SSL-Client-S-DN:   CN=svc-orders,O=Example,OU=payments
X-SSL-Client-SAN-URI: spiffe://example.com/ns/pay/sa/orders
```

These HTTP headers **are** visible on the proxy→app hop — and they inherit the
[header-based-sso](../../header-based-sso/README.md) trust boundary: the app must
accept them only from the proxy over a spoof-proof channel.

## No certificate → denied (3rd HAR entry)

With **optional** client auth, a request lacking a cert reaches the app and is denied
`403 client certificate required`. With **required** client auth the TLS handshake
itself aborts and no HTTP response is produced at all.

---

**Synthetic note:** the certificate subject, issuer, SPIFFE SAN, dates, and forwarded
headers are fabricated for a lab PKI. No real certificates or keys appear here.
