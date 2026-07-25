---
title: "TLS 1.3 Handshake"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8446"
---

# TLS 1.3 Handshake

**Status:** ✅ Current

How a TLS 1.3 connection is established: the client and server agree on a cipher and
exchange Diffie-Hellman **key shares** in the very first flight, derive shared secrets,
and switch to encryption after just **one round trip** (1-RTT). Everything after
`ServerHello` — the server's `EncryptedExtensions`, `Certificate`, `CertificateVerify`,
and `Finished` — is already encrypted, unlike TLS 1.2 where the certificate travelled
in the clear. This diagram covers the full handshake, the authentication step
(`CertificateVerify` signs the handshake transcript), and the major variants.

## What it shows

- The 1-RTT full handshake message flight for **TLS 1.3** (RFC 8446) and the keys
  derived at each stage (early / handshake / application traffic secrets).
- How TLS 1.3 differs from **TLS 1.2**: key share in the first flight vs a separate
  `ServerKeyExchange`/`ClientKeyExchange` round trip, no `ChangeCipherSpec` semantics,
  encrypted certificate, removal of static-RSA key transport and renegotiation.
- Server authentication via `Certificate` + `CertificateVerify` + `Finished`, then
  application data.

## Actors / components

| Component | Role |
|---|---|
| Client | Initiates the handshake, sends `ClientHello` with key shares and offered PSKs |
| Server | Selects parameters, proves identity, sends `EncryptedExtensions`/`Certificate` |
| CA | Trust anchor whose chain the client validates the server certificate against |
| Ticket / PSK store | Server-side resumption state (or self-encrypted session ticket) |

## Alternate scenarios covered

- **HelloRetryRequest (HRR)** — the client's `ClientHello` offered no key share in a
  group the server supports, so the server asks it to retry with an acceptable group.
- **Resumption via PSK / session ticket** — a `NewSessionTicket` from an earlier
  connection lets the client resume with a pre-shared key instead of a full certificate
  exchange.
- **0-RTT early data** — the client sends application data in its first flight using
  the resumption PSK, saving a round trip, at the cost of **replay risk** (early data is
  not forward-secret and can be replayed; only idempotent requests are safe).
- **Client-certificate request** — the server sends `CertificateRequest`; for the full
  mutual-authentication treatment see the linked mTLS diagram rather than duplicating it.

## Security notes

- **Forward secrecy is mandatory** in TLS 1.3: every full handshake uses ephemeral
  (EC)DHE key shares, so recording traffic and later stealing the server key does not
  decrypt past sessions. Static-RSA key transport is gone.
- **The certificate is encrypted** in TLS 1.3 (sent after `ServerHello` under the
  handshake traffic secret), so a passive observer no longer sees the server identity in
  the clear as it did in TLS 1.2.
- `CertificateVerify` signs a hash of the full handshake transcript, binding the
  proof-of-possession to *this* handshake — it cannot be lifted onto another connection.
- **0-RTT early data is replayable.** An attacker can capture and resend the early-data
  flight; do not put non-idempotent or state-changing requests in 0-RTT, and cap/dedupe
  it server-side. It also lacks forward secrecy relative to the PSK.
- Downgrade protection: TLS 1.3 servers embed a sentinel in `ServerHello.random` so a
  client can detect an attacker forcing a fallback to TLS 1.2/1.1.
- Prefer `X25519`/`secp256r1` key-share groups and AEAD ciphers
  (`TLS_AES_128_GCM_SHA256`, `TLS_CHACHA20_POLY1305_SHA256`); TLS 1.3 removed all
  non-AEAD and static-key cipher suites.

## Related diagrams

- [Mutual TLS (client-certificate authentication)](../../../authentication/tokenless/mutual-tls/README.md) — the `CertificateRequest`/`CertificateVerify` client-auth path in full.
- [mTLS in a service mesh](../mtls-service-mesh/README.md) — this handshake with SPIFFE identities and short-lived certs.
- [Reverse proxy + WAF](../reverse-proxy-waf/README.md) — where TLS is commonly terminated and re-encrypted.
- [PKI hierarchy](../../architecture/pki-hierarchy/README.md) — how the certificates validated here are issued.

## Files

- [sequence.md](./sequence.md) — the 1-RTT handshake message flight with HRR, resumption, 0-RTT, and client-cert alts.
- [swimlane.md](./swimlane.md) — Client / Server / CA / Ticket-store lanes across the handshake.
- [flowchart.md](./flowchart.md) — server decision logic: key-share match, resumption vs full, 0-RTT accept/reject.
