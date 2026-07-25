---
title: "Kerberos"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Kerberos

Diagrams for the Kerberos v5 protocol: the three core exchanges (AS, TGS, AP),
HTTP integration via SPNEGO, certificate-based initial authentication (PKINIT),
cross-realm trust, and the three delegation models.

The core protocol chain is: [AS Exchange](./as-exchange/README.md) →
[TGS Exchange](./tgs-exchange/README.md) → [AP Exchange](./ap-exchange/README.md).

## Diagrams

| Diagram | Description |
|---|---|
| [AS Exchange](./as-exchange/README.md) | Initial authentication: AS-REQ/AS-REP with pre-authentication, TGT and session key issuance encrypted under the krbtgt key. |
| [TGS Exchange](./tgs-exchange/README.md) | Ticket-granting: client presents TGT plus authenticator, KDC looks up the SPN and issues a service ticket encrypted with the service account key. |
| [AP Exchange](./ap-exchange/README.md) | Application authentication: client presents service ticket plus authenticator to the service; replay cache, optional mutual authentication via AP-REP. |
| [SPNEGO over HTTP](./spnego-http/README.md) | Browser single sign-on with HTTP Negotiate: 401 challenge, SPNEGO token wrapping a Kerberos AP-REQ, NTLM fallback paths. |
| [PKINIT](./pkinit/README.md) | Smart-card / certificate-based initial authentication: PA-PK-AS-REQ with signed AuthPack, KDC certificate-chain validation, DH or public-key encrypted reply. |
| [Cross-Realm](./cross-realm/README.md) | Authentication across realm trusts: referral TGTs, inter-realm krbtgt keys, transit path checking. |
| [Unconstrained Delegation](./unconstrained-delegation/README.md) | Service receives the user's forwarded TGT and can impersonate the user to any service; highest-risk delegation model. |
| [Constrained Delegation](./constrained-delegation/README.md) | S4U2Self / S4U2Proxy: service impersonates the user only to an allowlisted set of SPNs. |
| [Resource-Based Constrained Delegation](./resource-based-constrained-delegation/README.md) | RBCD: the resource (target) controls which front-end services may delegate to it via its security descriptor. |

## Related categories

- [Tokenless authentication](../tokenless/README.md) — SPNEGO is one of several browser SSO mechanisms; see [Header-Based SSO](../tokenless/header-based-sso/README.md) and [Mutual TLS](../tokenless/mutual-tls/README.md).
- [Architecture](../../infrastructure/architecture/README.md) — where Kerberos fits in an [IAM reference architecture](../../infrastructure/architecture/identity-provider-reference-architecture/README.md).
