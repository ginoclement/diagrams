---
title: "Mutual TLS (mTLS) Client-Certificate Authentication — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8705"
---

# Mutual TLS (mTLS) Client-Certificate Authentication — Client Snippets

Client snippets for mutual-TLS client-certificate auth. All hosts, certificates, and
keys referenced below are **synthetic** placeholders — generate your own test PKI.
Authentication happens **inside the TLS handshake**, not in an HTTP header.
(OAuth2 `tls_client_auth` / certificate-bound tokens: RFC 8705.)

## 0. Generate a synthetic test client cert (self-signed, for labs only)

```bash
# Synthetic CA
openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out ca.crt -days 365 \
  -subj "/CN=Synthetic Test CA"

# Client key + CSR + cert signed by the synthetic CA
openssl req -newkey rsa:2048 -nodes -keyout client.key -out client.csr \
  -subj "/CN=svc-orders/O=Example/OU=payments"
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out client.crt -days 90 \
  -extfile <(printf "subjectAltName=URI:spiffe://example.com/ns/pay/sa/orders")
```

## 1. Call the server presenting the client certificate

```bash
# curl performs the handshake and sends client.crt + proves possession of client.key.
curl -i --cert client.crt --key client.key --cacert ca.crt \
  https://api.internal.example.com/orders
# -> 200 OK   (server validated the chain, EKU=clientAuth, validity, revocation,
#              then mapped the cert SAN to an identity)
```

## 2. Combined cert+key (PKCS#12) form

```bash
openssl pkcs12 -export -in client.crt -inkey client.key -out client.p12 -passout pass:synthetic
curl -i --cert-type P12 --cert client.p12:synthetic --cacert ca.crt \
  https://api.internal.example.com/orders
```

## 3. No client certificate → rejected (required client auth)

```bash
curl -i --cacert ca.crt https://api.internal.example.com/orders
# -> TLS alert / connection reset during handshake (required client auth),
#    OR 403 Forbidden if the server does OPTIONAL client auth and denies at the app layer.
```

## SDK / library example (Python requests with a client cert)

```python
import requests

resp = requests.get(
    "https://api.internal.example.com/orders",
    cert=("client.crt", "client.key"),  # presents the client cert in the handshake
    verify="ca.crt",                     # trust the synthetic CA for the server cert
)
print(resp.status_code)  # 200
```

## Inspect what the handshake actually negotiated

```bash
# See the certificates exchanged and the negotiated TLS version:
openssl s_client -connect api.internal.example.com:443 \
  -cert client.crt -key client.key -CAfile ca.crt -tls1_3 </dev/null
```

---

**Synthetic note:** every certificate, key, subject, and SPIFFE SAN above is
fabricated for lab use. Never reuse these in production. No real keys or certificates
appear here.
