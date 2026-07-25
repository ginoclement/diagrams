---
title: "Mutual TLS (mTLS) Client-Certificate Authentication"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Mutual TLS (mTLS) Client-Certificate Authentication

**Status:** ✅ Current

Authentication performed **inside the TLS handshake** itself. In ordinary TLS only the
server proves its identity; in mutual TLS the server additionally sends a
`CertificateRequest`, and the client responds with its certificate plus a
`CertificateVerify` — a signature over the handshake transcript made with the private
key, proving possession. The server validates the certificate chain, key usage/EKU,
validity period, and revocation status (OCSP/CRL), then maps the certificate to an
application identity. No bearer token exists; the authentication is bound to the
connection.

## When it's used

- **Service-to-service** authentication in microservice meshes (Istio/Linkerd SPIFFE
  identities), between data centers, and for B2B API integrations.
- **Device and workload identity**: IoT fleets, MDM-managed endpoints, Kubernetes
  kubelet/API-server traffic.
- High-assurance user authentication with smart cards / PIV badges.
- OAuth2 `tls_client_auth` and certificate-bound access tokens (RFC 8705) reuse this
  handshake for client authentication.

## Actors

| Actor | Role |
|---|---|
| Client | Service, device, or user agent holding a certificate + private key |
| Server | TLS endpoint requesting and validating the client certificate |
| CA | Certificate authority that issued the client certificate |
| OCSP | Revocation responder (or CRL distribution point) |
| App | Application layer mapping the certificate to an identity/account |

## Alternate scenarios covered

- **No certificate provided** — behavior differs for *optional* vs *required* client
  auth: optional continues unauthenticated (app may deny later); required aborts the
  handshake.
- **Revoked certificate** — OCSP/CRL says revoked; handshake or request rejected.
- **Expired certificate** — validity-period check fails.

## Security notes

- **Validate the full chain to a trusted CA**, not just signature validity: check
  `notBefore`/`notAfter`, Extended Key Usage contains `clientAuth`, basic constraints,
  and name constraints where used.
- **Check revocation** (OCSP, ideally stapled, or CRL). Decide a soft-fail vs hard-fail
  policy explicitly — silent soft-fail turns revocation into a no-op.
- **Map certificate to identity deliberately**: match SAN (URI/DNS/email) or subject DN
  against a registry; never trust a display name alone. Pinning to a specific issuing
  CA prevents cross-CA impersonation.
- Private-key protection is the whole game: prefer hardware keys (TPM, HSM, smart
  card) and short-lived certs with automated rotation (e.g. SPIFFE SVIDs).
- If a reverse proxy terminates TLS, it must pass the verified cert (or its validation
  result) to the app over a **trusted, spoof-proof channel** — the same trust-boundary
  problem as [header-based-sso](../header-based-sso/README.md).
- In TLS 1.3 client auth happens after encryption is established, so the client cert
  is not visible to passive observers (it is in TLS 1.2).

## Diagrams

- [sequence.md](./sequence.md) — full handshake with CertificateRequest/CertificateVerify and alt paths.
- [swimlane.md](./swimlane.md) — lanes for Client, Server, CA/OCSP, App.
- [flowchart.md](./flowchart.md) — validation pipeline: chain, expiry, EKU, revocation, identity mapping.

## Related diagrams

- [http-basic-auth](../http-basic-auth/README.md) — the weaker service-to-service pattern mTLS replaces.
- [header-based-sso](../header-based-sso/README.md) — passing proxy-verified identity to backends.
- [Kerberos PKINIT](../../kerberos/pkinit/README.md) — certificates bootstrapping Kerberos tickets.
- [TLS termination patterns](../../../infrastructure/network-security/reverse-proxy-waf/README.md) — where the handshake ends and what that means for mTLS.
