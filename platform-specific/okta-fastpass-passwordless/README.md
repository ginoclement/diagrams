# Okta FastPass — Device-Bound Passwordless Authentication

**Status:** ✅ Current

**Okta FastPass** is Okta Verify's phishing-resistant, passwordless factor. Instead
of a shared secret, the enrolled device holds a **device-bound private key** (in the
Secure Enclave / TPM / Keystore). When a user signs in, the Okta Sign-In Widget
**probes the local Okta Verify app** — over a **loopback HTTP** channel or a
**universal/app link** — and Okta Verify returns a **signed attestation** proving
device identity, device management state, and (optionally) user verification. The
signature is bound to the Okta org's challenge, so a phishing site cannot replay it.

## What makes this Okta-specific (vs the generic ceremony)

The underlying idea — a device-held private key signing a server challenge — is the
same phishing-resistant model as
[WebAuthn / Passkey authentication](../../tokenless/webauthn-passkey-authentication/README.md).
What is Okta-specific here is the **transport and attestation**: the Sign-In Widget
discovers the local Okta Verify client via **loopback (`http://localhost` probe)** or
**universal link**, Okta Verify attaches **device attestation and management
signals** (managed vs unmanaged, from Okta's Device Trust / endpoint integrations),
and the whole exchange plugs into the OIE
[policy-driven sign-in](../okta-identity-engine-signin/README.md) as one factor.

## When it is used

- Passwordless first-factor login on a device with Okta Verify enrolled.
- Phishing-resistant step-up for sensitive apps under an Authentication Policy.
- Desktop SSO replacement where FastPass proves a managed device silently.

## Actors

| Actor | Role |
|---|---|
| User | Human; performs optional biometric user verification |
| Browser | Renders the Okta Sign-In Widget; opens loopback / universal link to Okta Verify |
| Okta Verify | Local Okta Verify app holding the device-bound private key |
| Okta | Okta org: issues the FastPass challenge, verifies the signed attestation, applies device assurance |

## Alternate scenarios covered

- **Loopback vs universal link** — the Widget first tries a loopback server probe
  (`http://localhost:<port>`); if that is blocked, it falls back to a
  universal/app-link handoff.
- **Device not registered** — no Okta Verify enrollment for this org on the device;
  fall back to another factor or enroll.
- **User verification (UV)** — policy requires biometric/PIN, so Okta Verify performs
  UV before signing.

## Related diagrams

- [WebAuthn / Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md) — the generic phishing-resistant signature ceremony FastPass parallels.
- [Okta Identity Engine Sign-In](../okta-identity-engine-signin/README.md) — the policy pipeline that sequences FastPass as a factor.
- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the token issuance that follows a successful factor.
- [FIDO2 / Passkey Registration](../../enrollment-and-update/fido2-passkey-registration/README.md) — parallel device-key enrollment ceremony.

## Files

- [sequence.md](sequence.md) — challenge, loopback / universal-link probe, signed attestation, verification; alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Okta Verify, Okta.
- [flowchart.md](flowchart.md) — probe-transport selection and attestation validation with error terminals.
