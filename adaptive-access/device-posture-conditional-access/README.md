# Device Posture Conditional Access

**Status:** ✅ Current

## What it is

An access policy that treats **the device as a first-class condition**: a valid user
identity is necessary but not sufficient — the request must also come from a **managed /
compliant device** presenting acceptable **posture signals** before access is granted. At
sign-in the policy engine (PDP) requires the endpoint to prove itself with a **device
certificate or hardware attestation**, then queries the **compliance / MDM service** for
the device's current state: enrolled and managed, disk encrypted, OS at a required patch
level, screen lock enabled, EDR / antivirus healthy, not jailbroken / rooted. The PDP maps
those signals to an outcome — **grant** full access to a compliant managed device, **grant
limited** access (browser-only, no download, session controls) to a non-compliant or
unmanaged one, or **block** and route to **remediation**. This is the device half of Zero
Trust: "**never trust, always verify**" applied to the endpoint, not just the user.

## When it is used

- Conditional-access deployments (Microsoft Entra Conditional Access, Okta Device Trust,
  Google BeyondCorp) that gate corporate resources on device health, not only identity.
- BYOD and hybrid fleets where personal and unmanaged devices must get reduced or no access
  while managed devices flow through.
- Compliance regimes requiring that only encrypted, patched, managed endpoints reach
  regulated data.

## Actors

| Actor | Role |
|---|---|
| User | Human signing in from an endpoint |
| Device | The endpoint plus its management / MDM agent, holding a device certificate |
| Client | Browser or native app initiating the access request |
| PDP | Policy decision point / conditional-access engine evaluating identity + device conditions |
| Compliance | MDM / compliance and attestation service reporting device posture |
| Resource | The application or data the policy protects |

## Alternate scenarios covered

- **Compliant managed device → grant** — identity valid, device managed and posture healthy;
  full access issued.
- **Non-compliant device → limited or block** — a managed but out-of-policy device (missing
  patch, disabled encryption) gets a limited session or is blocked with a remediation path.
- **Unmanaged / BYOD → restricted** — an unenrolled device is denied or held to a
  browser-only, download-blocked session.
- **Attestation failure → deny** — the device cannot prove its identity or its posture claim
  fails hardware attestation; treated as untrusted.
- **Remediation loop** — the user brings the device back into compliance (encrypt, patch,
  re-enroll) and retries.

## Security notes

- **Do not trust client-asserted posture.** Signals a device reports about itself can be
  forged — bind them to **hardware attestation** (TPM, Secure Enclave, managed device
  certificate) so the claim is rooted in tamper-resistant hardware.
- **Compliance is a moment-in-time snapshot.** A device compliant at sign-in can drift;
  pair this with continuous evaluation so posture changes revoke access mid-session rather
  than only at the next login.
- **Prefer limited over binary block where it fits.** Browser-only, no-download,
  session-bounded access lets unmanaged devices do low-risk work without full exposure,
  reducing pressure to weaken the policy.
- **Fail closed on the compliance service.** If posture cannot be evaluated, default to the
  restricted or blocked outcome, never to full grant.
- **Enrollment is the trust anchor.** The device certificate / management enrollment is what
  everything hinges on — protect enrollment, and revoke device identity when an endpoint is
  lost or retired.

## Related diagrams

- [risk-based-adaptive-authentication](../risk-based-adaptive-authentication/README.md) — device posture as one hard signal feeding the broader risk score.
- [continuous-access-evaluation](../continuous-access-evaluation/README.md) — re-checking posture *after* the session is issued, not only at sign-in.
- [step-up-authentication](../step-up-authentication/README.md) — challenging for a stronger factor when the device condition is marginal.
- [impossible-travel-anomaly](../impossible-travel-anomaly/README.md) — a location/velocity signal that combines with device posture in policy.
- [Conditional Access Evaluation (Entra)](../../cloud-iam/entra/conditional-access-evaluation/README.md) — a vendor realisation of this policy.
- [Device Join / Registration (Entra)](../../cloud-iam/entra/device-join-registration/README.md) — how a device gets the identity this policy checks.

## Files

- [sequence.md](sequence.md) — sign-in → device attestation → posture query → grant / limited / block, plus attestation-failure and remediation alternates.
- [swimlane.md](swimlane.md) — lanes for User, Device, Client, PDP, Compliance, Resource.
- [flowchart.md](flowchart.md) — the identity-plus-device decision tree with explicit block and remediation terminals.
