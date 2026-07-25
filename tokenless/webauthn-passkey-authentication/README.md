# WebAuthn / Passkey Authentication Ceremony

**Status:** ✅ Current

The FIDO2/WebAuthn **authentication** (assertion) ceremony: the server (Relying
Party) sends a random challenge; the browser calls `navigator.credentials.get()`;
the authenticator performs **user verification** (biometric or PIN) and signs the
challenge — together with client data and authenticator data — using a private key
that never leaves the authenticator. The server verifies the signature against the
stored public key, plus `rpIdHash`, `origin`, flags, and the signature counter.
No shared secret and no bearer token: the proof is an origin-bound digital signature,
and phishing sites cannot obtain a valid assertion because the browser scopes
credentials to the RP ID.

This diagram covers the **authentication** ceremony only. Credential creation is in
[enrollment/passkey-enrollment](../../enrollment-and-update/fido2-passkey-registration/README.md); a
concrete product implementation is in
[platforms/pocketid/passkey-login](../../platform-specific/pocketid-passkey-oidc/README.md).

## When it's used

- Passwordless first-factor login (passkeys synced via iCloud Keychain, Google
  Password Manager, 1Password, or device-bound on security keys).
- Second factor / step-up on top of password login.
- Cross-device sign-in: hybrid transport ("CaBLE") where a phone holding the passkey
  scans a QR code shown by a nearby computer.

## Actors

| Actor | Role |
|---|---|
| User | Performs the biometric / PIN gesture |
| Browser | Mediates the ceremony, enforces RP-ID scoping, builds clientDataJSON |
| Authenticator | Platform (Touch ID, Windows Hello, phone) or roaming (security key); holds private keys |
| Server | Relying Party: issues challenges, verifies assertions, stores public keys + counters |

## Alternate scenarios covered

- **No credential for this RP ID** — authenticator has nothing scoped to the site
  (or the user is on a phishing domain, where the mismatch is exactly the defense);
  fall back to another method or enrollment.
- **User-verification failure** — biometric/PIN fails or is cancelled; no assertion
  is produced.
- **Cross-device (hybrid / CaBLE) flow** — QR code + BLE proximity check, passkey on
  the phone signs for the session on the computer.

## Security notes

- **Verify everything server-side**: signature over `authenticatorData ||
  SHA-256(clientDataJSON)` with the stored public key; `clientDataJSON.type ==
  "webauthn.get"`; `challenge` matches the one issued (single-use, then discarded);
  `origin` is an expected origin; `rpIdHash == SHA-256(rp id)`; UP flag set; UV flag
  set if user verification was required.
- **Signature counter**: if the stored counter is non-zero and the new value is not
  greater, treat as a possible **cloned authenticator** and step up or block. Synced
  passkeys legitimately report counter 0 — policy must tolerate that.
- Challenges must be random (>= 16 bytes), single-use, and short-lived; bind the
  pending challenge to the login session server-side.
- Phishing resistance comes from the **browser**, not the user: a look-alike domain
  has a different RP ID, so the authenticator simply has no credential to offer.
- For usernameless flows use **discoverable credentials** (resident keys) and expect
  `userHandle` in the assertion; for username-first flows send an `allowCredentials`
  list.
- After success, establish an ordinary server-side session
  ([session-cookie](../session-cookie/README.md)) — rotate the session ID as usual.

## Diagrams

- [sequence.md](sequence.md) — challenge, credentials.get, user verification, assertion verification; alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Authenticator, Server.
- [flowchart.md](flowchart.md) — server-side assertion validation pipeline with failure terminals.

## Related diagrams

- [Passkey enrollment](../../enrollment-and-update/fido2-passkey-registration/README.md) — the registration ceremony that creates the credential.
- [Pocket ID passkey login](../../platform-specific/pocketid-passkey-oidc/README.md) — passkey-only OIDC provider using this ceremony.
- [magic-link](../magic-link/README.md) — the phishable passwordless alternative passkeys improve on.
- [Okta FastPass](../../platform-specific/okta-fastpass-passwordless/README.md) — platform take on phishing-resistant device-bound auth.
- [MFA enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — passkeys as a registered factor.
