---
title: "Device Enrollment (MDM / UEM)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Device Enrollment (MDM / UEM)

**Status:** ✅ Current

A device is brought under **Mobile Device Management / Unified Endpoint Management**.
The user (or an automated provisioning flow) authenticates, the MDM issues an
**enrollment profile**, the device installs a **management profile** (with an MDM push
certificate so the server can send commands), the MDM evaluates **compliance policy**,
and — on success — the device receives a **device identity certificate** used for
certificate-based authentication and Wi-Fi/VPN access. The result is a managed,
attested device identity the IdP can trust in conditional-access decisions.

## When it's used

- **BYOD** enrollment: a personal phone/laptop gets a work profile and limited management.
- **Corporate / supervised** enrollment: company-owned devices via Apple Automated Device
  Enrollment (ADE/DEP), Android Enterprise zero-touch, or Windows Autopilot.
- Onboarding a device so it can pass **device-based conditional access** at login.

## Actors

| Actor | Role |
|---|---|
| User | Authenticates and consents to management (BYOD) or receives a pre-provisioned device |
| Device | Runs the OS enrollment agent, installs profiles, generates the CSR, enforces policy |
| MDM Server | Issues enrollment + management profiles, holds the push cert, evaluates compliance |
| CA | Issues the device identity certificate from the CSR (often via SCEP) |
| IdP Server | Consumes the resulting device identity/compliance signal for conditional access |

## Alternate scenarios covered

- **BYOD vs supervised/corporate** — user-driven personal enrollment with a work profile
  versus zero-touch supervised enrollment where the device is management-locked.
- **Compliance check fails** — device is out of policy (jailbroken, OS too old, no
  passcode/encryption) and is **quarantined / blocked** until remediated.
- **Re-enrollment** — profile renewal or moving to a new MDM tenant.
- **Unenroll / remote wipe** — the user or admin removes management; a corporate wipe
  or selective (work-data-only) wipe is issued.

## Security notes

- The management profile grants the MDM significant control; on BYOD, scope it to a
  **work profile / managed apps** to keep personal data out of reach.
- The device identity key pair is generated **on-device**; only the CSR/public key leaves
  it. Prefer hardware-backed keys (Secure Enclave, TPM, StrongBox).
- Compliance must be **continuously re-evaluated**, not just at enrollment; a device that
  drifts out of policy should lose access at the next conditional-access check.
- Bind the enrollment to a verified user identity so a device cannot enroll anonymously
  into a privileged posture.

## Diagrams

- [sequence.md](./sequence.md) — auth, enrollment profile, management profile + push cert, compliance, identity cert; alts.
- [swimlane.md](./swimlane.md) — lanes for User, Device, MDM Server, CA, IdP Server.
- [flowchart.md](./flowchart.md) — enrollment + compliance decision logic with quarantine and wipe terminals.

## Related diagrams

- [Certificate enrollment (SCEP / EST)](../certificate-enrollment-scep-est/README.md) — how the device identity certificate is actually issued.
- [Mutual TLS](../../../authentication/tokenless/mutual-tls/README.md) — using the device certificate as a client credential.
- [FIDO2 / passkey registration](../fido2-passkey-registration/README.md) — registering the platform authenticator this device hosts.
- [Joiner onboarding](../../user-lifecycle/joiner-onboarding/README.md) — device provisioning as part of new-hire setup.
