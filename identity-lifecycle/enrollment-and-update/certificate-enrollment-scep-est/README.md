---
title: "Certificate Enrollment (SCEP and EST)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8894, RFC 7030"
---

# Certificate Enrollment (SCEP and EST)

**Status:** ✅ Current

A device or user obtains an **X.509 identity certificate** from a CA through an automated
enrollment protocol. Two protocols are covered:

- **SCEP** (Simple Certificate Enrollment Protocol, RFC 8894): the client fetches CA
  capabilities and certs (`GetCACaps`, `GetCACert`), then submits a PKCS#10 CSR wrapped in
  a PKCS#7 `PKCSReq` message, typically authorized by a **challenge password** (one-time
  password). Pending requests are polled with `GetCertInitial`.
- **EST** (Enrollment over Secure Transport, RFC 7030): a modern TLS-based replacement.
  The client calls `/.well-known/est/cacerts`, then `POST /.well-known/est/simpleenroll`
  with a CSR over an authenticated TLS channel; renewal uses `/simplereenroll`.

Both end the same way: the CA issues the certificate, the client installs it, and the
certificate is later **renewed** before expiry.

## When it's used

- Provisioning device identity certificates during [MDM enrollment](../device-enrollment-mdm/README.md).
- Issuing certificates for Wi-Fi (EAP-TLS), VPN, or [mutual TLS](../../../authentication/tokenless/mutual-tls/README.md).
- Automated, large-scale certificate lifecycle where manual CSR handling is impractical.

## Actors

| Actor | Role |
|---|---|
| Client / Device | Generates the key pair + CSR, runs SCEP/EST, installs and renews the cert |
| RA | Registration Authority: validates the request and challenge, authorizes issuance |
| CA | Certificate Authority: signs and issues the certificate, publishes CA certs |

## Alternate scenarios covered

- **EST `/simpleenroll` alternate** — the same enrollment over TLS instead of SCEP's
  PKCS#7 messaging.
- **Challenge / one-time password invalid** — SCEP `PKCSReq` (or EST auth) is rejected.
- **Pending manual approval** — the CA returns `pending`; the client polls
  (`GetCertInitial`) until an operator approves or denies.
- **Auto-renewal before expiry** — the client re-enrolls (SCEP renewal or EST
  `/simplereenroll`) ahead of expiration, ideally using the current cert as its credential.

## Security notes

- The private key is generated **on the client** and never transmitted; only the CSR
  (public key + subject) is sent.
- SCEP's shared **challenge password** is a weak authenticator — scope it tightly, make it
  single-use and short-lived, or prefer EST's TLS client-auth / renewal-with-current-cert.
- Verify the issued certificate's public key matches the CSR key before installing.
- Renew early (well before `notAfter`) and, where supported, re-key on renewal.

## Diagrams

- [sequence.md](./sequence.md) — SCEP GetCACaps/PKCSReq happy path; EST `/simpleenroll`, invalid challenge, pending, renewal alts.
- [swimlane.md](./swimlane.md) — lanes for Client/Device, RA, CA.
- [flowchart.md](./flowchart.md) — protocol selection, challenge validation, pending-poll, and issuance decision logic.

## Related diagrams

- [Device enrollment (MDM)](../device-enrollment-mdm/README.md) — the MDM flow that triggers this enrollment.
- [Mutual TLS](../../../authentication/tokenless/mutual-tls/README.md) — using the issued certificate as a client credential.
- [PKINIT](../../../authentication/kerberos/pkinit/README.md) — certificate-based Kerberos initial authentication using such certs.
