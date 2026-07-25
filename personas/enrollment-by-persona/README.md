# Enrollment by Persona

**Status:** ✅ Current

## What it is

Enrollment — registering the factors, devices, and credentials an identity will later
authenticate with — forks by **who initiates it and how much trust exists at the start**:

- **Workforce** — enrollment is **IT/MDM-pushed**. Factors and device certificates are
  provisioned into a managed environment; the user completes a bounded, policy-driven
  registration on a trusted device.
- **Consumer** — enrollment is **self-service and progressive**. The user registers
  themselves, adds factors when they choose (or when prompted at a sensitive action), and no
  administrator is involved.
- **Guest** — enrollment is **invite-redeem**. An inviting user or system issues a
  time-limited invitation; the guest redeems it, does light verification, and registers a
  minimal factor scoped to the shared resource.

It references the base enrolment diagrams for factor mechanics and shows only the
per-persona initiation and trust differences.

## Actors

| Actor | Role |
|---|---|
| `User` | The person enrolling (workforce, consumer, or guest) |
| `IT` | IT / MDM pushing configuration and factors (workforce) |
| `IdP` | Identity provider registering factors / credentials |
| `Inviter` | User or system issuing a guest invitation |

## Alternate scenarios covered

- **Workforce IT/MDM-pushed** — MDM enrols the device, pushes cert and factor policy, user
  completes registration on a managed device.
- **Consumer self-service** — self-registration, progressive factor addition, no admin.
- **Guest invite-redeem** — invitation issued, redeemed, light verification, minimal scoped factor.

## Security notes

- Enrollment is a **bootstrapping** moment: whatever trust you establish here is what every
  later authentication inherits. Verify identity proportionally to the access the factor will unlock.
- Workforce enrolment should bind factors to a **managed, attested device** so a stolen factor
  off a personal device cannot be registered silently.
- Consumer self-service must resist **enumeration and automated abuse** (rate limits, proof of
  control of email/phone) since there is no administrator gate.
- Guest invitations must be **single-use, time-limited, and audience-bound** so a leaked invite
  link cannot enrol an unintended party.
- Prefer phishing-resistant factors ([FIDO2 / passkey](../../enrollment-and-update/fido2-passkey-registration/README.md))
  at enrolment for all personas; step up verification before allowing a new factor to replace an existing one.

## Related diagrams

- [MFA Enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — base factor registration
- [Device Enrollment (MDM)](../../enrollment-and-update/device-enrollment-mdm/README.md) / [Certificate Enrollment (SCEP/EST)](../../enrollment-and-update/certificate-enrollment-scep-est/README.md) — workforce/device base flows
- [FIDO2 / Passkey Registration](../../enrollment-and-update/fido2-passkey-registration/README.md) — phishing-resistant factor enrolment
- [Email / Phone Verification](../../enrollment-and-update/email-phone-verification/README.md) — consumer/guest proof-of-control base flow
- [Authentication by Persona](../authentication-by-persona/README.md) — where these enrolled factors are used
- [Personas reference](../README.md) — archetypes and variance matrix

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — per-persona `alt` enrolment exchange
- [swimlane.md](swimlane.md) — User / IT / IdP / Inviter lanes
- [flowchart.md](flowchart.md) — initiation-model decision tree
