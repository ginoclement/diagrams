# Deprecated & Legacy Mechanisms

This repository catalogs **every option**, including obsolete ones — kept for reference and
clearly marked. Generated from the per-diagram `Status:` lines (see [CONVENTIONS.md](CONVENTIONS.md)).

## ⛔ Deprecated — do not use for new work

- [Kerberos Unconstrained Delegation](kerberos/unconstrained-delegation/README.md)
- [OIDC Implicit Flow (Legacy — Deprecated)](oidc/implicit/README.md)
- [Resource Owner Password Credentials (ROPC) Grant](oidc/resource-owner-password-credentials/README.md)

## 🟡 Legacy — still valid, but newer options preferred

- [XACML — PDP / PEP Reference Architecture](authorization/xacml-pdp-pep/README.md)
- [OpenID Connect Session Management 1.0](oidc/session-management/README.md)
- [HTTP Basic Authentication](tokenless/http-basic-auth/README.md)
- [Service-Account Key Lifecycle](workload-identity/service-account-key-lifecycle/README.md)

> Some legacy/deprecated variants are documented as alternates *inside* an otherwise-current
> diagram (e.g. IMDSv1, SMS/voice OTP, GitFlow, plain approve/deny push, standing SSH keys).
