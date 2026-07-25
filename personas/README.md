# Personas — Identity Archetypes and Flow Variance

**Status:** ✅ Current

## What it is

Personas are the **identity archetypes** an IAM platform serves. They are defined once
here so every flow can reference the same vocabulary. The point of naming them is that
**personas drive how flows fork**: a "login" is not one flow but several, because a
workforce employee, a consumer, a partner user, a privileged admin, and a non-human
workload each authenticate, enrol, recover, and get reviewed differently. The base
diagrams elsewhere in this repo describe *mechanisms* (SAML SSO, OIDC client credentials,
SCIM, SSPR); personas describe *who runs them and how the run differs*.

Use this page two ways:

- As a **glossary** — the archetype table below fixes the persona names used across the repo.
- As a **router** — the variance matrix shows, per flow, whether a persona meaningfully
  differs and where to read the detail. A flow gets its own persona-specific diagram folder
  **only when it materially forks** by persona (see [CONVENTIONS.md](../CONVENTIONS.md),
  "Persona variants"). Otherwise the difference is just a matrix note.

## Persona archetypes

| Persona | Nature | Defining traits |
|---|---|---|
| **Workforce** | Human | Employee mastered in HR; full corporate SSO + MFA; birthright + RBAC access; fully JML-governed lifecycle. |
| **Contractor** | Human | Non-employee worker; owned by a sponsor, not HR; time-boxed with a **hard expiry**; scoped, least-privilege access. |
| **Partner/B2B** | Human | User belonging to an **external organization**; federated in via that org's IdP; no local credential or lifecycle mastering. |
| **Consumer** | Human | Self-registered public end user; self-service everything; prefers social login / passwordless; no sponsor, no HR record. |
| **Privileged** | Human (elevated) | Holds admin / high-impact entitlements; requires step-up auth and **just-in-time (PIM/JIT)** elevation; credentials often vaulted. |
| **Guest** | Human | Short-lived invited external individual (not a whole org); **invite-redeem** onboarding; minimal, expiring access. |
| **Workload** | Non-human | Service / app / machine identity; **non-interactive** auth (client-credentials, mTLS); secrets/certs rotated, never "recovered". |
| **Device** | Non-human (or hybrid) | Endpoint identity; authenticated by certificate / hardware attestation; MDM/EMM-enrolled; a factor in human auth as well as a principal. |
| **Break-glass** | Human (emergency) | Sealed emergency-admin account; used only when normal auth is unavailable; heavy alerting and after-the-fact audit. |
| **Developer** | Human | Builds and operates systems; consumes API keys / PATs / OIDC dev clients; self-service credential issuance with short-lived tokens preferred. |

Non-human personas (Workload, Device) have **no interactive UX**: no login page, no MFA
prompt, no self-service recovery. Their equivalents are client authentication, attestation,
and key/cert rotation — which is exactly why they fork the flows below rather than reuse them.

## Persona × flow variance matrix

Rows are personas; columns are the flows most affected by persona. Each cell is a one-line
note on how that persona's flow differs; links point to the diagram that covers it. Cells
marked *n/a* mean the flow does not apply to that persona.

| Persona | Authentication | MFA / step-up | Enrollment | JML lifecycle | Credential recovery | Access review | Authorization model |
|---|---|---|---|---|---|---|---|
| **Workforce** | Corporate SSO ([SAML](../saml/sp-initiated-sso/README.md) / [OIDC](../oidc/authorization-code-pkce/README.md)); [by-persona](authentication-by-persona/README.md) | MFA always on; risk-based step-up | IT/MDM-pushed factors ([by-persona](enrollment-by-persona/README.md)) | HR-driven joiner→mover→leaver ([JML](../user-lifecycle/jml-orchestration/README.md), [by-persona](jml-lifecycle-by-persona/README.md)) | SSPR + helpdesk fallback ([by-persona](authentication-by-persona/README.md)) | Periodic manager cert ([review](../user-lifecycle/access-review-certification/README.md), [by-persona](authentication-by-persona/README.md)) | [RBAC](../authorization/rbac/README.md) birthright + role bundles |
| **Contractor** | Corporate SSO, often restricted realm ([by-persona](authentication-by-persona/README.md)) | MFA always on; stricter device posture | IT-provisioned, expiry-bound factors ([by-persona](enrollment-by-persona/README.md)) | Sponsor-driven + **hard expiry**, no HR master ([by-persona](jml-lifecycle-by-persona/README.md)) | SSPR + helpdesk, sponsor re-verify | More frequent cert; **sponsor** attests ([by-persona](authentication-by-persona/README.md)) | Scoped [RBAC](../authorization/rbac/README.md) / [ABAC](../authorization/abac/README.md), least privilege |
| **Partner/B2B** | Federated from partner IdP; invitation then home-realm discovery ([by-persona](authentication-by-persona/README.md)) | MFA **asserted by partner IdP**; step-up only for local high-risk | No local factor enrolment; trust partner assertions | External org, **no local mastering**; deprovision on partner offboard or invite expiry ([by-persona](jml-lifecycle-by-persona/README.md)) | Handled at **partner IdP**; local side has none | Owner attests external access retention ([by-persona](authentication-by-persona/README.md)) | Coarse [RBAC](../authorization/rbac/README.md) at trust boundary; [ABAC](../authorization/abac/README.md) on org attributes |
| **Consumer** | Social / passwordless / [passkey](../tokenless/webauthn-passkey-authentication/README.md) / [magic-link](../tokenless/magic-link/README.md) ([by-persona](authentication-by-persona/README.md)) | Optional MFA; step-up on sensitive action | **Self-service** progressive registration ([by-persona](enrollment-by-persona/README.md)) | Self-registration + self-service delete; no HR/sponsor | **SSPR only**, no helpdesk ([by-persona](authentication-by-persona/README.md)) | n/a (no entitlement review) | [Scopes/consent](../authorization/oauth-consent-authorization/README.md); minimal roles |
| **Privileged** | Normal auth **plus step-up + PIM/JIT** elevation ([by-persona](authentication-by-persona/README.md)) | **Phishing-resistant** step-up mandatory each elevation | Hardware key enrolment; strict binding ([by-persona](enrollment-by-persona/README.md)) | Layered on base persona; JIT grant/expire of admin roles | **Vaulted** — no direct reset; check-out/rotate ([by-persona](authentication-by-persona/README.md)) | Frequent, security-team cert; JIT logs reviewed ([by-persona](authentication-by-persona/README.md)) | [ABAC](../authorization/abac/README.md) + time-boxed elevation; SoD enforced |
| **Guest** | Invite link → redeem → light verification ([by-persona](authentication-by-persona/README.md)) | MFA on redeem for sensitive shares | **Invite-redeem** self-enrolment ([by-persona](enrollment-by-persona/README.md)) | Invite creates, expiry/revoke removes; no lifecycle events | Re-invite rather than reset | Owner re-attests or lets expire | Resource-scoped grant only; [ReBAC](../authorization/rebac-zanzibar/README.md) share |
| **Workload** | Non-interactive: [client-credentials](../oidc/client-credentials/README.md) / [mTLS](../tokenless/mutual-tls/README.md) ([by-persona](authentication-by-persona/README.md)) | n/a (no human factor); posture via attestation | Owner registers client + credential ([enrol note](enrollment-by-persona/README.md)) | Owner-attested; **rotation** not mover; **decommission** not leaver ([by-persona](jml-lifecycle-by-persona/README.md)) | **Rotate keys/certs**, not reset ([by-persona](authentication-by-persona/README.md)) | Owner attests need + rotation currency ([by-persona](authentication-by-persona/README.md)) | [Scopes](../authorization/scopes-claims-entitlements/README.md) / entitlements bound to client |
| **Device** | Certificate / attestation as principal ([mTLS](../tokenless/mutual-tls/README.md), [SCEP/EST](../enrollment-and-update/certificate-enrollment-scep-est/README.md)) | n/a as principal; is a factor for humans | [MDM](../enrollment-and-update/device-enrollment-mdm/README.md) / [cert enrolment](../enrollment-and-update/certificate-enrollment-scep-est/README.md) | Enrol → compliant → retire/wipe; asset-driven | Re-enrol / re-issue certificate | Compliance posture review, not entitlement | Posture attribute feeding [ABAC](../authorization/abac/README.md) |
| **Break-glass** | Sealed local credential, bypasses federation | Offline/second-channel factor; alert on use | Provisioned once, sealed; periodic rehearsal | Created deliberately; reviewed, never auto-JML | **Reseal + rotate** after any use; no SSPR ([by-persona](authentication-by-persona/README.md)) | Every use audited; existence reviewed ([by-persona](authentication-by-persona/README.md)) | Standing max privilege, use-gated + alerted |
| **Developer** | [OIDC dev client](../oidc/authorization-code-pkce/README.md) + [device-code](../oidc/device-authorization/README.md) for CLIs | MFA on human auth; tokens short-lived | Self-service key/PAT/client issuance ([by-persona](enrollment-by-persona/README.md)) | Workforce lifecycle for the human; keys rotate/expire | Reissue PAT/key; short-lived token refresh ([by-persona](authentication-by-persona/README.md)) | Key/PAT usage + scope review | [Scopes/claims](../authorization/scopes-claims-entitlements/README.md); least-privilege tokens |

### How to read a fork

- **Human vs non-human** is the first split: Workload and Device have no interactive
  authentication, MFA, or self-service recovery — those columns become "client auth" and
  "rotation".
- **Who masters the identity** is the second: HR (Workforce), sponsor (Contractor), an
  external org (Partner/B2B), the user themself (Consumer/Guest), or an owner (Workload).
  This is what makes JML fork the hardest.
- **Blast radius** is the third: Privileged and Break-glass reuse another persona's flows
  but wrap them in step-up, JIT, vaulting, and audit.

## Persona-specific diagram folders

Only flows that materially fork have their own folder:

- [authentication-by-persona](authentication-by-persona/README.md) — workforce SSO+MFA vs
  consumer social/passwordless vs partner invitation-federation vs privileged step-up+PIM vs
  workload non-interactive client-credentials/mTLS.
- [jml-lifecycle-by-persona](jml-lifecycle-by-persona/README.md) — employee (HR) vs
  contractor (sponsor + hard expiry) vs partner (external, no local mastering) vs workload
  (owner-attested rotation and decommission).
- [enrollment-by-persona](enrollment-by-persona/README.md) — workforce IT/MDM-pushed vs
  consumer self-service vs guest invite-redeem.
- credential-recovery-[by-persona](authentication-by-persona/README.md) — consumer SSPR
  vs workforce SSPR+helpdesk vs privileged vaulted (no direct reset) vs workload rotate.
- access-review-[by-persona](authentication-by-persona/README.md) — cadence and approver
  differences: standard employee vs contractor vs privileged.

Flows that do **not** get a persona folder (variance is a matrix note only): logout,
consent, token refresh, session management, authorization-model internals.

## Related diagrams

- [JML Orchestration](../user-lifecycle/jml-orchestration/README.md) — the base lifecycle the
  persona forks specialise.
- [Access Review & Certification](../user-lifecycle/access-review-certification/README.md) —
  base review control.
- [MFA Enrollment](../enrollment-and-update/mfa-enrollment/README.md) /
  [Device Enrollment (MDM)](../enrollment-and-update/device-enrollment-mdm/README.md) — base enrolment.
- [Self-Service Password Reset](../password-management/self-service-reset/README.md) — base recovery.
- [RBAC](../authorization/rbac/README.md) / [ABAC](../authorization/abac/README.md) /
  [Scopes & Claims](../authorization/scopes-claims-entitlements/README.md) — authorization models referenced above.
- privileged-access/ and adaptive-access/ (parallel categories) — deeper PIM/JIT and
  risk-based detail the Privileged and step-up rows summarise.

## Files

- [README.md](README.md) — this document (glossary + variance matrix)
- [authentication-by-persona/](authentication-by-persona/README.md)
- [jml-lifecycle-by-persona/](jml-lifecycle-by-persona/README.md)
- [enrollment-by-persona/](enrollment-by-persona/README.md)
- [credential-recovery-by-persona/](credential-recovery-by-persona/README.md)
- [access-review-by-persona/](access-review-by-persona/README.md)

## More diagrams

- [Access Review by Persona](./access-review-by-persona/README.md)
- [Credential Recovery by Persona](./credential-recovery-by-persona/README.md)
