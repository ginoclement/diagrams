# Windows Hello for Business (WHfB)

**Status:** ✅ Current

## What it is

Windows Hello for Business replaces password sign-in with a **phishing-resistant,
TPM-bound asymmetric credential** unlocked by a local gesture (PIN or biometric). During
**provisioning**, after the user has signed in and passed MFA, Windows generates a
per-user key pair in the TPM; the public key is registered with Microsoft Entra ID (and,
for on-prem access, written to the user's `msDS-KeyCredentialLink` in AD). At **logon**,
the gesture unlocks the TPM-held private key, which signs a challenge to prove possession
— the private key never leaves the TPM and the gesture never leaves the device.

Two trust models exist for on-prem resource access:

- **Key trust** — the raw public key is mapped to the AD account; the DC uses it directly
  during Kerberos PKINIT.
- **Certificate trust** — an enterprise CA issues a logon certificate from the WHfB key
  (used with older DCs / ADFS); being phased out in favour of key trust and
  **Cloud Kerberos trust** (Entra issues a partial Kerberos TGT).

## When it is used

- Passwordless sign-in on Entra-joined / Hybrid-joined Windows devices.
- Satisfying an MFA grant control at [PRT](../primary-refresh-token/README.md) issuance —
  the gesture is "something you have" (TPM key) plus "something you are/know" (biometric/PIN).

## Actors

| Actor | Role |
|---|---|
| User | Person provisioning and later signing in with a gesture |
| Device | Windows endpoint running the provisioning and logon experience |
| TPM | Trusted Platform Module generating and holding the per-user WHfB key |
| Entra | Entra ID registering the public key and issuing tokens / Cloud Kerberos TGT |
| DC | On-prem domain controller doing PKINIT with the mapped key (hybrid access) |

## Alternate scenarios covered

- First-run provisioning (post-MFA key generation and registration).
- Everyday gesture logon (PIN or biometric unlocks the TPM key).
- Key trust vs certificate trust vs Cloud Kerberos trust for on-prem access.
- Biometric fallback to PIN; anti-hammering lockout after repeated bad PINs.
- Multi-device — a separate key is provisioned per device, never roamed.

## Security notes

- The credential is bound to the TPM and the specific device; it cannot be phished,
  replayed, or exfiltrated as a reusable secret the way a password can.
- The PIN is device-local and not a "short password" — it only unlocks the local key and
  is protected by TPM anti-hammering, not transmitted anywhere.
- Biometric templates stay on the device (Windows Hello), never sent to Entra or the DC.
- Cloud Kerberos trust removes the need to deploy certificates to every device while
  still granting on-prem Kerberos access — prefer it over certificate trust for new builds.
- Compromise of one device's key does not affect the user's other devices or the password.

## Related diagrams

- [Primary Refresh Token](../primary-refresh-token/README.md) — the gesture unlocks the key that requests the PRT
- [Device Join and Registration](../device-join-registration/README.md) — WHfB is provisioned after the device has an identity
- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — can require this phishing-resistant factor
- [Kerberos authentication](../../../kerberos/kerberos-authentication/README.md) — PKINIT / Cloud Kerberos trust reaches on-prem resources
- [WebAuthn / Passkey authentication](../../../tokenless/webauthn-passkey-authentication/README.md) — the FIDO2 cousin of this credential model

## Files

- [sequence.md](sequence.md) — provisioning and gesture logon with trust-model alternates
- [swimlane.md](swimlane.md) — lanes for User, Device, TPM, Entra, DC
- [flowchart.md](flowchart.md) — provisioning eligibility and logon gesture decisions
