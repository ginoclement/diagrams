# Self-Service Password Reset (SSPR)

**Status:** ✅ Current

The classic **"forgot password"** flow. A user who cannot log in proves control of a
**recovery factor** already bound to their account (email or SMS OTP, security
questions, or a registered MFA authenticator) and then sets a new password. No
helpdesk involved — the user drives the whole reset themselves.

The security-critical property is that this flow must **not** become an account
takeover or account-enumeration oracle. It runs unauthenticated (the user cannot
log in, by definition), so every step is hardened against abuse.

## When it's used

- A user forgot their password or their password expired and they cannot reach a
  logged-in "change password" screen.
- A user suspects compromise and wants to rotate their own credential without waiting
  for an admin.
- As the recovery leg of a passwordless or MFA-first system, where "reset" still
  re-establishes the fallback secret.

## Actors

| Actor | Role |
|---|---|
| User | Human who forgot the password and requests a reset |
| Browser | Renders the reset UI, follows the reset link |
| IdP | Identity provider / auth server: orchestrates the flow, enforces policy |
| Directory | User store where the credential and recovery factors live |
| RecoverySvc | Recovery / notification service: sends email or SMS OTP and reset links |

## Alternate scenarios covered

- **Account-enumeration protection** — the response and timing are **uniform** whether
  or not the account exists, so an attacker cannot harvest valid usernames.
- **Recovery factor fails** — wrong OTP or wrong security answers are rate-limited and
  eventually lock the reset attempt.
- **Reset link expiry** — a single-use, time-limited token; expired or reused links are
  rejected and a fresh one must be requested.
- **MFA-backed reset** — if the account has a registered authenticator, possession of a
  recovery email/SMS alone is not enough; a step-up MFA check is required.

## Security notes

- **Uniform response:** always show "if an account exists, we've sent instructions" and
  keep response timing constant. Never reveal whether the username or email was found.
- **Single-use, expiring tokens:** reset links carry a high-entropy token bound to the
  account, invalidated on first use and after a short TTL (minutes, not days). Store a
  hash of the token, not the token itself.
- **Invalidate old sessions:** on a successful reset, destroy all existing sessions and
  refresh tokens for the account — a reset is a strong signal the old credential may be
  compromised. See [session-cookie](../../tokenless/session-cookie/README.md) and
  [RP-initiated logout](../../oidc/rp-initiated-logout/README.md).
- **Do not auto-login blindly:** re-establish the session only after the new password is
  set, and re-arm MFA where applicable.
- **Rate-limit** reset requests per account and per source IP; throttle OTP verification.
- Prefer MFA/authenticator recovery over SMS OTP where possible — SMS is subject to SIM
  swap and interception.

## Diagrams

- [sequence.md](sequence.md) — request, verify recovery factor, set new password, kill sessions, plus alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP, Directory, RecoverySvc.
- [flowchart.md](flowchart.md) — decision logic: enumeration guard, factor check, token expiry, policy check.

## Related diagrams

- [admin-initiated-reset](../admin-initiated-reset/README.md) — the same reset driven by a helpdesk/admin instead of the user.
- [password-change-authenticated](../password-change-authenticated/README.md) — changing a password while already logged in.
- [account-unlock](../account-unlock/README.md) — recovering from lockout, which may or may not require a reset.
- [breached-password-detection](../breached-password-detection/README.md) — the breach check applied to the new password.
- [session-cookie](../../tokenless/session-cookie/README.md) — the sessions that must be invalidated on reset.
- [mfa-enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — how the MFA recovery factor got registered.
