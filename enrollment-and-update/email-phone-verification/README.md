---
title: "Email / Phone Verification (Contact-Channel Verification)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Email / Phone Verification (Contact-Channel Verification)

**Status:** ✅ Current

Proving that a user actually controls an **email address or phone number** before the
system treats it as verified. The server sends a proof over the channel — either a
**one-time code (OTP)** the user types back, or a **verification link** the user clicks —
and on confirmation marks the channel `verified`. This is the building block behind
account signup, adding a recovery contact, and the SMS/voice MFA factor.

## When it's used

- Confirming an email or phone at signup or when a user first adds it.
- Verifying a **new value** before it replaces an already-verified channel (change of
  email/phone requires re-verification of the new address).
- Establishing a recovery channel used by [self-service password reset](../../password-management/self-service-reset/README.md).

## Actors

| Actor | Role |
|---|---|
| User | Requests verification, receives the code/link, confirms possession |
| Browser | Hosts the UI, submits the code or follows the link |
| IdP Server | Issues and stores the verification token, marks the channel verified |
| Verification Service | Delivers the OTP/link over email (SMTP) or SMS/voice |

## Alternate scenarios covered

- **Link vs OTP code** — a clickable signed verification link versus a short numeric code
  the user types back.
- **Expired / invalid code or link** — token has expired, been used, or does not match;
  verification is refused.
- **Resend + rate limit** — the user requests another code; sends are throttled per
  address and per account to prevent abuse and bombing.
- **Change of an already-verified channel** — updating a verified email/phone marks it
  **unverified** and requires verifying the new value before it becomes active.

## Security notes

- Store only a **hash** of the OTP/link token; make it single-use and short-lived
  (minutes for OTP, up to an hour for links).
- Bind the token to the specific address and account; verifying one channel must not
  verify another.
- Rate-limit sends and validation attempts; lock out after repeated failures to stop
  brute force and SMS-bombing.
- For links, sign the token and confirm it server-side; never trust an unsigned
  `?verified=true`-style parameter.
- Do not activate the new channel (or grant its privileges, e.g. MFA) until verification
  completes.

## Diagrams

- [sequence.md](sequence.md) — send code/link, user confirms, mark verified; alts for link vs OTP, expiry, resend, change.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP Server, Verification Service.
- [flowchart.md](flowchart.md) — token validation, expiry, rate-limit, and re-verification decision logic.

## Related diagrams

- [MFA enrollment](../mfa-enrollment/README.md) — the SMS/voice OTP factor reuses this channel-verification pattern.
- [Profile attribute update](../profile-attribute-update/README.md) — where changing a sensitive channel triggers re-verification.
- [Self-service password reset](../../password-management/self-service-reset/README.md) — recovery relying on a verified channel.
- [Magic link](../../tokenless/magic-link/README.md) — the same signed-link mechanism used for login rather than verification.
