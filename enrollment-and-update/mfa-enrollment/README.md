# MFA Enrollment (Registering a New Authentication Factor)

An already-authenticated user registers a **new multi-factor authentication (MFA)
factor** with the IdP. The canonical case is a **TOTP authenticator app** (RFC 6238):
the server generates a per-user secret, hands it to the user as a QR code (an
`otpauth://` URI) plus a manual key, and the app derives 6-digit time-based codes from
it. The user proves possession by typing the **first generated code** before the factor
is activated, and the server issues one-time **backup/recovery codes**. Push-based
authenticator apps follow the same shape but bind a device push token instead of a
shared secret.

Registration always happens **inside an authenticated (and often recently
re-authenticated) session** — enrolling a factor is itself a sensitive operation, so
policy may force a step-up before the secret is ever provisioned.

## When it's used

- A user opts in to (or is required by policy to) add a second factor to their account.
- Adding an additional/backup factor (e.g. a TOTP app alongside an existing security key).
- Replacing a lost or rotated factor, or migrating from SMS to an authenticator app.

## Actors

| Actor | Role |
|---|---|
| User | Chooses a factor type, scans/enters the secret, types the proof code |
| Browser | Hosts the enrollment UI, renders the QR code, posts the proof code |
| Authenticator | TOTP app (Google Authenticator, Authy) or push app holding the secret/device key |
| IdP Server | Provisions the secret, verifies proof-of-possession, stores the factor, issues backup codes |

## Alternate scenarios covered

- **SMS / voice OTP factor** — instead of a shared TOTP secret, the server sends a code
  over an out-of-band channel and the user echoes it back (weaker, phishable factor).
- **Proof-of-possession fails** — the entered code is wrong or expired; the pending
  factor stays inactive and the user retries (with attempt throttling).
- **Replacing / removing a factor** — deleting an existing factor, which itself
  requires re-authentication and may be blocked if it is the last remaining factor.
- **Admin-required step-up before enrolling** — high-assurance tenants force a fresh
  re-authentication (or an existing strong factor) before a new factor can be added.

## Security notes

- The TOTP secret is provisioned **once**; treat the pending factor as inactive until
  the user proves possession with a valid code, then bind it to the account atomically.
- Verify the proof code against the current time window with a small skew tolerance
  (typically +/- 1 step) and rate-limit attempts to defeat brute force.
- Backup codes are one-time-use; store only their hashes and show them exactly once.
- Never let the enrollment endpoint accept a client-supplied secret — the server
  generates and owns it.

## Diagrams

- [sequence.md](sequence.md) — secret provisioning, QR, proof code, backup codes; alts for SMS, failure, removal, step-up.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Authenticator, IdP Server, Verification Service.
- [flowchart.md](flowchart.md) — enrollment decision logic with proof-of-possession and step-up gates.

## Related diagrams

- [FIDO2 / passkey registration](../fido2-passkey-registration/README.md) — registering a phishing-resistant authenticator instead of a shared secret.
- [Email / phone verification](../email-phone-verification/README.md) — the OTP-to-a-channel pattern reused by the SMS factor.
- [Profile attribute update](../profile-attribute-update/README.md) — the same step-up-before-sensitive-change gate.
- [WebAuthn / passkey authentication](../../tokenless/webauthn-passkey-authentication/README.md) — authenticating with a registered strong factor.
- [Joiner onboarding](../../user-lifecycle/joiner-onboarding/README.md) — where a new hire is first prompted to enrol MFA.
