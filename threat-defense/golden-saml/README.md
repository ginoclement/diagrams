---
title: "Golden SAML"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Golden SAML

**Status:** ✅ Current (active threat; defenses current)

## What it is

**Golden SAML** is a forgery attack against SAML federation. An attacker who steals the
Identity Provider's **token-signing private key** (and the corresponding certificate) can
mint arbitrarily valid SAML **assertions** for *any* user, with *any* attributes/groups,
*without ever authenticating* at the IdP. Because the Service Provider trusts anything
signed by that key, a forged assertion is indistinguishable from a real one at the SP —
the attacker becomes a "golden" identity, similar in spirit to a Kerberos
[Golden Ticket](../golden-silver-ticket/README.md) but for SAML.

It abuses the normal [SAML SSO](../../authentication/saml/idp-initiated-sso/README.md) trust model: the SP
validates the assertion **signature** against the IdP's published certificate and then
trusts the contents. Golden SAML skips the entire authentication and MFA step at the IdP.

## When it is used

- **Post-compromise** lateral movement / persistence. The attacker must *already* have
  obtained the signing key — e.g. by compromising the ADFS/federation server, exporting the
  key from a soft (non-HSM) key store, or reading it from a backup or the config database.
- To bypass MFA and conditional access that live at the IdP, and to persist even after
  passwords are reset (the signing key, not the password, is the secret).

## Actors

| Actor | Role |
|---|---|
| Attacker | Holds the stolen IdP signing key; forges and submits assertions to the SP |
| Victim | The user (often a privileged one) being impersonated by the forged assertion |
| IdP | The legitimate Identity Provider / federation server whose signing key was stolen (bypassed entirely during forgery) |
| SP | Service Provider / relying party that trusts the IdP signing certificate |
| Defender controls | Key protection (HSM), assertion monitoring, short lifetimes, sign-in log correlation |

## Alternate scenarios covered

- **Key held in an HSM (forgery prevented):** the private key is non-exportable, so the
  attacker cannot obtain it to sign anything — the attack never starts.
- **Anomaly detection at the SP / SIEM (forgery detected):** a valid-signature assertion
  that has **no matching IdP authentication event** is flagged.
- **Short assertion lifetime + strict `NotOnOrAfter`:** narrows the replay window and forces
  the attacker to keep re-forging, generating more detectable signal.

## Security notes

Golden SAML is fundamentally a **key-management** problem: once the signing key leaks, the
SP cannot cryptographically tell forgeries from genuine assertions. Defense is therefore
split between **preventing key theft** and **detecting the mismatch** between forged
assertions and real authentication events.

### Detection

- **Correlate SP logins with IdP authentications.** A golden assertion produces a successful
  SP session with **no corresponding IdP sign-in event** — this mismatch is the single
  strongest signal. Feed both logs into the SIEM and alert on SP-success-without-IdP-auth.
- **Monitor the federation/signing key.** Alert on export of the token-signing certificate,
  ADFS/DKM (Distributed Key Manager) key access, and reads of the federation config database.
- **Assertion anomalies:** unusual `AuthnInstant` vs assertion issue time, impossible travel,
  assertions for accounts that never use SSO, unexpected `Issuer`/`AudienceRestriction`, or
  attribute/group values the IdP would not normally emit.
- **Certificate lifecycle:** watch for unexpected new signing certificates being added to SP
  trust (an attacker may register their own).

### Mitigation

- **Protect the signing key in an HSM** (or a cloud KMS with non-exportable keys). A
  non-exportable key cannot be stolen and reused offline — this is the primary control.
- **Harden and isolate the federation server** (Tier-0 asset): restrict admin access,
  apply least privilege, and protect DKM keys.
- **Rotate the token-signing key** on a schedule and immediately after any suspected
  compromise (rotate **twice** where the platform keeps a previous key for overlap).
- **Short assertion lifetimes** and strict validation of `Conditions`
  (`NotBefore`/`NotOnOrAfter`), `Audience`, `Recipient`, and one-time-use assertion IDs.
- **Prefer modern token protections** and continuous access evaluation where the platform
  supports them; reduce reliance on long-lived, statically-trusted signing material.

## Related diagrams

- [SAML IdP-initiated SSO](../../authentication/saml/idp-initiated-sso/README.md) — the legitimate flow whose signed assertion is forged here.
- [SAML SP-initiated SSO](../../authentication/saml/sp-initiated-sso/README.md) — SP-side assertion validation that a golden assertion satisfies.
- [Golden & Silver Ticket](../golden-silver-ticket/README.md) — the Kerberos analogue of key-theft forgery.
- [Secrets management](../../infrastructure/architecture/secrets-management/README.md) — HSM / key custody that prevents key theft.

## Files

- [sequence.md](./sequence.md) — the forgery path, then HSM/monitoring defenses in `alt`/`opt` blocks.
- [swimlane.md](./swimlane.md) — Attacker / Victim / IdP / Defender-controls lanes.
- [flowchart.md](./flowchart.md) — where key protection and log correlation force a deny/detect terminal.
