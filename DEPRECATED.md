# Deprecated & Legacy Mechanisms

This repository is a catalog of **every option**, including obsolete ones — kept for
reference and clearly marked. Status is set per diagram (see [CONVENTIONS.md](CONVENTIONS.md)).

> Note: diagrams added in the first pass (saml, oidc, tokenless, kerberos, and the original
> lifecycle/enrollment/password/architecture/network sets) predate the explicit `Status:`
> line convention. The mechanisms below are deprecated or legacy regardless; a Status-line
> backfill across those first-pass diagrams is tracked in [BACKLOG.md](BACKLOG.md).

## ⛔ Deprecated — do not use for new work

| Mechanism | Diagram | Use instead |
|---|---|---|
| OIDC Implicit flow | [oidc/implicit](oidc/implicit/README.md) | [Authorization Code + PKCE](oidc/authorization-code-pkce/README.md) |
| Kerberos unconstrained delegation | [kerberos/unconstrained-delegation](kerberos/unconstrained-delegation/README.md) | [Resource-based constrained delegation](kerberos/resource-based-constrained-delegation/README.md) |
| SMS / voice OTP as a primary factor | (within) [enrollment-and-update/mfa-enrollment](enrollment-and-update/mfa-enrollment/README.md) | [FIDO2 / passkey](enrollment-and-update/fido2-passkey-registration/README.md) |
| Long-lived stored cloud keys in CI | (contrast in) [cicd/oidc-to-cloud-federation](cicd/oidc-to-cloud-federation/README.md) | OIDC-to-cloud federation (same diagram) |
| ROPC grant *(diagram pending — see BACKLOG)* | — | [Authorization Code + PKCE](oidc/authorization-code-pkce/README.md) |

## 🟡 Legacy — still valid, but newer options are preferred

| Mechanism | Diagram | Preferred |
|---|---|---|
| SAML 2.0 for new consumer apps | [saml/](saml/README.md) | [OIDC](oidc/README.md) |
| NTLM authentication | (fallback in) [directory-and-sync/active-directory-logon](directory-and-sync/active-directory-logon/README.md) | Kerberos / modern federation |
| XACML | [authorization/xacml-pdp-pep](authorization/xacml-pdp-pep/README.md) | [PBAC with OPA/Cedar](authorization/pbac-policy-engine/README.md) |
| GitFlow (for continuous-delivery teams) | [cicd/code-promotion-branch-based](cicd/code-promotion-branch-based/README.md) | Trunk-based development (same diagram) |
| AWS AssumeRoleWithSAML | [cloud-iam/aws/assumerole-saml](cloud-iam/aws/assumerole-saml/README.md) | [IAM Identity Center](cloud-iam/aws/iam-identity-center-sso/README.md) |
| Static service-account keys | [workload-identity/service-account-key-lifecycle](workload-identity/service-account-key-lifecycle/README.md) | [Workload identity federation](workload-identity/workload-identity-federation-generic/README.md) |
