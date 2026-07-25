---
title: "Learning Path"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Learning Path

A suggested progression through identity & access security, from fundamentals to advanced
topics, using the diagrams in this repository. Each stage links representative flows; follow
the "Related diagrams" links inside each to go deeper.

> How to read a diagram folder: start with its `README.md` (what it is, actors, when used,
> alternates), then `sequence.md` for the message flow, `swimlane.md` for who does what, and
> `flowchart.md` for the decision and error logic.

## Stage 0 — Fundamentals

Understand the vocabulary and the shapes first.

- [Glossary & legend](GLOSSARY.md)
- [Session cookie authentication](authentication/tokenless/session-cookie/README.md) — the simplest "how does a site remember me" flow
- [TLS handshake](infrastructure/network-security/tls-handshake/README.md) — the transport everything else rides on

## Stage 1 — Web SSO (the core of modern auth)

- [OIDC Authorization Code + PKCE](authentication/oidc/authorization-code-pkce/README.md) — the default for apps today
- [OIDC Authorization Code (confidential client)](authentication/oidc/authorization-code/README.md)
- [SAML SP-initiated SSO](authentication/saml/sp-initiated-sso/README.md) — the enterprise incumbent
- Then compare them: [choosing an authentication protocol](reference/decision-guides/choosing-an-authentication-protocol/README.md)

## Stage 2 — Tokens, sessions, and logout

- [Refresh token grant](authentication/oidc/refresh-token/README.md)
- [Token introspection](authentication/oidc/token-introspection/README.md) and [revocation](authentication/oidc/token-revocation/README.md)
- [RP-initiated logout](authentication/oidc/rp-initiated-logout/README.md) and [back-channel logout](authentication/oidc/back-channel-logout/README.md)
- Decision: [session vs token](reference/decision-guides/choosing-session-vs-token/README.md)
- Know what to avoid: [Implicit flow (deprecated)](authentication/oidc/implicit/README.md)

## Stage 3 — Authorization (what you may do)

- [RBAC](authorization/rbac/README.md) → [ABAC](authorization/abac/README.md) → [ReBAC / Zanzibar](authorization/rebac-zanzibar/README.md) → [PBAC (OPA/Cedar)](authorization/pbac-policy-engine/README.md)
- [Scopes vs claims vs entitlements](authorization/scopes-claims-entitlements/README.md)
- [PEP/PDP enforcement](authorization/policy-decision-enforcement/README.md)
- Decision: [choosing an authorization model](reference/decision-guides/choosing-an-authorization-model/README.md)

## Stage 4 — Identity lifecycle & directories

- [Joiner / Mover / Leaver orchestration](identity-lifecycle/user-lifecycle/jml-orchestration/README.md)
- [SCIM provisioning](identity-lifecycle/user-lifecycle/scim-provisioning/README.md)
- [MFA enrollment](identity-lifecycle/enrollment-and-update/mfa-enrollment/README.md) and [FIDO2 / passkey registration](identity-lifecycle/enrollment-and-update/fido2-passkey-registration/README.md)
- [Self-service password reset](identity-lifecycle/password-management/self-service-reset/README.md)
- [Active Directory logon](identity-lifecycle/directory-and-sync/active-directory-logon/README.md) and [password hash sync](identity-lifecycle/directory-and-sync/password-hash-sync/README.md)

## Stage 5 — Strong & phishing-resistant authentication

- [WebAuthn / passkey authentication](authentication/tokenless/webauthn-passkey-authentication/README.md)
- [Kerberos AS/TGS/AP exchanges](authentication/kerberos/as-exchange/README.md)
- Decision: [choosing an MFA factor](reference/decision-guides/choosing-an-mfa-factor/README.md)

## Stage 6 — Cloud IAM & workload identity

- [AWS STS AssumeRole](platforms/cloud-iam/aws/sts-assumerole/README.md) and [AssumeRoleWithWebIdentity (OIDC)](platforms/cloud-iam/aws/assumerole-web-identity-oidc/README.md)
- [Entra Conditional Access](platforms/cloud-iam/entra/conditional-access-evaluation/README.md)
- [GCP Workload Identity Federation](platforms/cloud-iam/gcp/workload-identity-federation/README.md)
- [SPIFFE/SPIRE](workload-identity/spiffe-spire-issuance/README.md) and [Kubernetes SA tokens](workload-identity/kubernetes-serviceaccount-token/README.md)
- Decision: [choosing workload cloud auth](reference/decision-guides/choosing-workload-cloud-auth/README.md)

## Stage 7 — Privileged & adaptive access

- [JIT privilege elevation](privileged-access/jit-privilege-elevation/README.md) and [break-glass](privileged-access/break-glass-emergency-access/README.md)
- [Risk-based adaptive authentication](authentication/adaptive-access/risk-based-adaptive-authentication/README.md) and [step-up](authentication/adaptive-access/step-up-authentication/README.md)
- [Continuous Access Evaluation](authentication/adaptive-access/continuous-access-evaluation/README.md)

## Stage 8 — Threats & defense

Pair each attack with the flow it abuses and the mitigation that stops it.

- [AiTM MFA phishing](threat-defense/aitm-mfa-phishing/README.md) — why passkeys matter
- [Token theft & replay](threat-defense/token-theft-replay/README.md) — why DPoP / mTLS-bound tokens matter
- [Golden SAML](threat-defense/golden-saml/README.md) and [Kerberoasting](threat-defense/kerberoasting/README.md)
- [OAuth consent phishing](threat-defense/oauth-consent-phishing/README.md)

## Stage 9 — Putting it together (architecture & delivery)

- [Identity provider reference architecture](infrastructure/architecture/identity-provider-reference-architecture/README.md)
- [Zero-trust architecture](infrastructure/architecture/zero-trust-architecture/README.md)
- [CI/CD OIDC-to-cloud federation](infrastructure/cicd/oidc-to-cloud-federation/README.md) and [artifact signing / provenance](infrastructure/cicd/artifact-signing-provenance/README.md)

---

For "which should I use?" questions at any stage, see the [decision guides](reference/decision-guides/README.md).
