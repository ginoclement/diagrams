# FIDO2 / Passkey Registration Ceremony

**Status:** ✅ Current

The WebAuthn **registration** (attestation) ceremony that creates a credential:
the Relying Party (server) issues a challenge and creation options; the browser calls
`navigator.credentials.create()`; the authenticator generates a new **public/private key
pair** scoped to the RP ID, keeps the private key, and returns an **attestation object**
containing the credential public key, the credential ID, and (optionally) an attestation
statement about the authenticator model. The server validates the attestation and stores
the **credential public key + credential ID** (plus sign count and transports) against
the user account for use in later authentications.

This diagram covers **registration only**. The matching **authentication** (assertion)
ceremony — `navigator.credentials.get()` — lives in
[tokenless/webauthn-passkey-authentication](../../tokenless/webauthn-passkey-authentication/README.md).

## When it's used

- Enrolling a passkey as a passwordless first factor (synced or device-bound).
- Adding a FIDO2 security key or platform authenticator as a strong second factor.
- Provisioning a **discoverable (resident) credential** so the user can later sign in
  without typing a username.

## Actors

| Actor | Role |
|---|---|
| User | Performs the user-verification gesture (biometric / PIN) and consents |
| Browser | Runs `navigator.credentials.create()`, enforces RP-ID/origin, builds clientDataJSON |
| Authenticator | Platform (Touch ID, Windows Hello) or roaming (security key); generates and holds the key pair |
| RP Server | Relying Party: issues challenge + `PublicKeyCredentialCreationOptions`, verifies attestation, stores the public key |

## Alternate scenarios covered

- **Platform vs roaming authenticator** — `authenticatorAttachment` of `platform`
  (built-in) versus `cross-platform` (USB/NFC/BLE security key).
- **Attestation conveyance `none` vs `direct`** — privacy-preserving self/none
  attestation versus a verifiable attestation statement checked against FIDO metadata.
- **User verification required** — `userVerification: "required"` forces a biometric/PIN
  gesture, setting the UV flag.
- **Discoverable / resident key for passkeys** — `residentKey: "required"` stores a
  client-side credential keyed by RP ID + user handle for usernameless login.
- **Duplicate credential** — `excludeCredentials` already lists this authenticator, so
  it refuses to create a second credential for the same account.

## Security notes

- Verify server-side: `clientDataJSON.type == "webauthn.create"`, the challenge matches
  the one issued (single-use), `origin` is expected, and `rpIdHash == SHA-256(rpId)`.
- Enforce the UP flag (and UV flag when `userVerification` was `required`); parse the
  attestation object and, for `direct`, validate the attestation statement and trust path
  against FIDO MDS.
- Reject if the credential ID already exists; store credential ID, public key (COSE),
  sign count, transports, and AAGUID.
- Pass `excludeCredentials` so an already-enrolled authenticator cannot double-register.
- Challenges must be random (>= 16 bytes), single-use, and bound to the session.

## Diagrams

- [sequence.md](sequence.md) — options, `credentials.create()`, attestation, server verification; alts for attachment, attestation type, UV, resident key, duplicate.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Authenticator, RP Server.
- [flowchart.md](flowchart.md) — server-side attestation validation pipeline with error terminals.

## Related diagrams

- [WebAuthn / passkey authentication](../../tokenless/webauthn-passkey-authentication/README.md) — the assertion ceremony that uses the credential registered here.
- [MFA enrollment](../mfa-enrollment/README.md) — registering a shared-secret factor as the phishable alternative.
- [Mutual TLS](../../tokenless/mutual-tls/README.md) — another public-key, phishing-resistant credential model.
- [Device enrollment (MDM)](../device-enrollment-mdm/README.md) — establishing the device that hosts a platform authenticator.
