---
title: "Architecture Diagrams"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Architecture Diagrams

Higher-level **architecture** diagrams — system/component topology and trust boundaries —
rather than single-protocol message flows. Where the [SAML](../../authentication/saml/README.md),
[OIDC](../../authentication/oidc/README.md), [Kerberos](../../authentication/kerberos/README.md), and
[tokenless](../../authentication/tokenless/README.md) categories show individual protocol exchanges, these
diagrams show how the components that run those protocols are arranged, isolated, and
trusted. Each folder still uses the three-view convention, adapted for architecture:

- **sequence.md** — a representative *runtime* flow through the architecture.
- **swimlane.md** — a *topology* view: subgraphs are zones/tiers (Public, DMZ, App Tier,
  Data Tier, Management Plane) with components placed in their zone and arrows showing the
  allowed cross-boundary flows.
- **flowchart.md** — a *decision* view (an authorization decision, a validation path).

| Diagram | Description |
|---|---|
| [enterprise-identity-environment](./enterprise-identity-environment/README.md) | Product-oriented map of a real estate — SailPoint, Okta, Entra ID, AD, Workday, CyberArk, apps, users — in two views: a functional systems architecture and a network-security view with ports/protocols. |
| [identity-provider-reference-architecture](./identity-provider-reference-architecture/README.md) | Internal components of a modern IdP: authentication, token/assertion, session, directory, MFA, admin/policy, audit, and federation — with trust boundaries around each data store. |
| [federation-topology](./federation-topology/README.md) | Hub-and-spoke identity federation: a broker proxying between many upstream IdPs (SAML/OIDC/social) and downstream SPs, with home-realm discovery and claim normalization. |
| [zero-trust-architecture](./zero-trust-architecture/README.md) | NIST SP 800-207 zero trust: Policy Decision Point (Policy Engine + Administrator), Policy Enforcement Points, continuous verification, device posture and context signals, no network-location trust. |
| [api-gateway-authn-authz](./api-gateway-authn-authz/README.md) | API gateway / BFF: TLS termination, JWT/introspection token validation, scope-based authorization, rate limiting, token exchange, and routing to microservices. |
| [secrets-management](./secrets-management/README.md) | Vault-style secrets platform: pluggable auth methods, dynamic secrets, leasing/rotation, encryption-as-a-service, app + CI/CD consumers, and an HSM-sealed store with full audit. |
| [pki-hierarchy](./pki-hierarchy/README.md) | PKI trust hierarchy: offline root CA to intermediate/issuing CAs to end-entity certs, HSM key protection, CRL/OCSP revocation, and certificate path validation. |

## Related categories

- [SAML](../../authentication/saml/README.md) and [OIDC](../../authentication/oidc/README.md) — the federation protocol flows that run through the IdP and federation topologies.
- [Kerberos](../../authentication/kerberos/README.md) — [cross-realm](../../authentication/kerberos/cross-realm/README.md) trust, the on-prem analogue of brokered federation.
- [Tokenless](../../authentication/tokenless/README.md) — [mutual TLS](../../authentication/tokenless/mutual-tls/README.md) and session patterns used as workload identity and enforcement.
- [Enrollment & update](../../identity-lifecycle/enrollment-and-update/certificate-enrollment-scep-est/README.md) — how end entities enroll into the PKI hierarchy.
