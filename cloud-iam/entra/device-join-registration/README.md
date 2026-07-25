# Device Join and Registration (Entra Join / Hybrid Join / Registered)

**Status:** ✅ Current

## What it is

The three ways a device gets an identity in Microsoft Entra ID, each producing a **device
object** in the directory and a **device certificate** whose private key is protected by
the TPM:

- **Entra Registered** (BYOD / workplace join) — the device is added to Entra with a
  device identity but the user still signs in with a personal or local account; used to
  satisfy device-based Conditional Access on personal devices.
- **Entra Joined** — the device is owned/managed by the org and joined only to Entra
  (cloud-only); users sign in with their Entra account and CloudAP issues a
  [PRT](../primary-refresh-token/README.md).
- **Entra Hybrid Joined** — the device is domain-joined to on-prem Active Directory **and**
  registered to Entra (synced via Entra Connect); it holds both an AD computer account and
  an Entra device object, enabling SSO to both cloud and on-prem.

Registration runs the **Device Registration Service (DRS)**: the device generates a key
pair, obtains a device certificate, and (on modern devices) performs **TPM attestation**
so Entra can trust the key is hardware-bound.

## When it is used

- Onboarding corporate Windows/macOS/iOS/Android endpoints for SSO, Conditional Access
  device signals, and Intune management.
- Hybrid Join for organizations mid-migration that still depend on on-prem AD and Group
  Policy.

## Actors

| Actor | Role |
|---|---|
| User | Person joining or registering the device |
| Device | Endpoint generating keys and holding the device certificate |
| TPM | Trusted Platform Module securing the device key and providing attestation |
| DRS | Entra Device Registration Service issuing the device object + certificate |
| Entra | Entra ID directory storing the device object and evaluating trust |
| ADDS | On-prem Active Directory (Hybrid Join only) providing the computer account + SCP |

## Alternate scenarios covered

- Entra Join (cloud-only) — the recommended greenfield path.
- Entra Registered (BYOD) — lighter identity, no PRT for the primary session by default.
- Hybrid Join — dual registration via the Service Connection Point (SCP) and Entra Connect
  sync.
- TPM attestation success vs software-key fallback (attestation not available).
- Re-registration after device reset or key rotation.

## Security notes

- Prefer TPM-attested keys; a hardware-bound device key is what makes device-based CA and
  the PRT resistant to cloning.
- Hybrid Join depends on correct SCP configuration and Entra Connect device writeback —
  misconfiguration silently leaves devices unregistered and CA device controls unmet.
- The device certificate authenticates the device, not the user; pair it with user MFA in
  CA so a compliant device alone is never sufficient for sensitive access.
- Disabling or deleting the device object immediately removes it as a CA-trusted device
  and (with CAE) can revoke device-bound tokens.

## Related diagrams

- [Primary Refresh Token](../primary-refresh-token/README.md) — issued to Entra-joined/hybrid-joined devices
- [Windows Hello for Business](../windows-hello-for-business/README.md) — provisioned after join, per-user key on the device
- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — consumes join type + compliance as signals
- [Hybrid Identity Sync](../hybrid-identity-sync/README.md) — Entra Connect, which also syncs the hybrid device object
- [Kerberos authentication](../../../kerberos/kerberos-authentication/README.md) — the on-prem auth Hybrid Join preserves

## Files

- [sequence.md](sequence.md) — registration handshake for each join type
- [swimlane.md](swimlane.md) — lanes for User, Device, TPM, DRS, Entra, on-prem AD
- [flowchart.md](flowchart.md) — which join type applies and the trust decisions
