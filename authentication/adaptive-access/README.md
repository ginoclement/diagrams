---
title: "Adaptive / Risk-Based / Continuous Access"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Adaptive / Risk-Based / Continuous Access

Flows where an authorization decision is **not** a one-time yes/no at the front door but a
**continuous, signal-driven** judgement. A risk or policy engine scores context — device
posture, location, velocity, IP reputation, behaviour — and returns **allow**, **step-up**
(challenge for a stronger factor), or **deny**. The decision can be re-made mid-session and
long-lived sessions can be revoked in near-real-time when a critical signal changes.

Each folder contains a sequence diagram, a swimlane diagram, and a decision-focused
flowchart plus a README with actors, alternates, and security notes.

| Diagram | Status | Description |
|---|---|---|
| [risk-based-adaptive-authentication](./risk-based-adaptive-authentication/README.md) | ✅ Current | A risk engine scores device, location, velocity, and reputation signals at sign-in and returns allow / step-up / deny. |
| [step-up-authentication](./step-up-authentication/README.md) | ✅ Current | Mid-session step-up for a sensitive action using an authn-context / `acr_values` / claims challenge (RFC 9470). |
| [continuous-access-evaluation](./continuous-access-evaluation/README.md) | 🔵 Emerging | A long-lived session is revoked in near-real-time on a critical event via a claims challenge back to the IdP. |
| [mfa-fatigue-number-matching](./mfa-fatigue-number-matching/README.md) | ✅ Current | Push-bombing / MFA-fatigue attacks and the number-matching mitigation that defeats blind approvals. |
| [device-posture-conditional-access](./device-posture-conditional-access/README.md) | ✅ Current | Policy requires a compliant / managed device and posture signals before granting access. |
| [impossible-travel-anomaly](./impossible-travel-anomaly/README.md) | ✅ Current | Detecting impossible-travel / anomalous sessions and forcing re-auth or blocking. |

## Cross-cutting ideas

- **Signals in, decision out.** A risk engine or PDP consumes signals (device, location,
  velocity, reputation, threat intel) and emits a decision with a **required assurance
  level**. The authenticator's job is to raise assurance to meet it — that is *step-up*.
- **Assurance levels are the currency.** OIDC `acr`/`amr`, SAML `AuthnContextClassRef`, and
  RFC 9470 authentication-context challenges let a relying party *demand* a specific
  assurance and let the IdP *assert* the one it achieved.
- **Sessions are re-evaluated, not just granted.** Continuous Access Evaluation (CAE) and
  conditional-access re-checks close the gap between a token's lifetime and reality.
- **Phishing-resistant factors** (FIDO2 / passkeys) are the strongest step-up target and
  the thing an adaptive policy should prefer — see
  [Passkey Authentication](../tokenless/webauthn-passkey-authentication/README.md).

## Related categories

- [cloud-iam / Entra](../../platforms/cloud-iam/entra/continuous-access-evaluation/README.md) — the
  vendor-specific realisation of CAE and
  [conditional-access evaluation](../../platforms/cloud-iam/entra/conditional-access-evaluation/README.md).
- [authorization](../../authorization/policy-decision-enforcement/README.md) — the PDP/PEP
  split these flows build on, and [ABAC](../../authorization/abac/README.md) for attribute-driven policy.
- [threat-defense](../../threat-defense/README.md) — the attacks (AiTM, token theft, MFA
  fatigue) these controls are designed to blunt.
- [oidc](../oidc/README.md) — the underlying grants; adaptive policy sits inside the IdP
  portion of [Authorization Code + PKCE](../oidc/authorization-code-pkce/README.md).

## More diagrams

- [Device Posture Conditional Access](./device-posture-conditional-access/README.md)
- [Impossible Travel / Anomalous Session Detection](./impossible-travel-anomaly/README.md)
- [MFA Fatigue (Push Bombing) and Number Matching](./mfa-fatigue-number-matching/README.md)
