# Authenticated Password Change

A user who is **already logged in** deliberately changes their password from an account
or settings page. Unlike a reset, the user knows the current password — so the flow
**reauthenticates** by requiring the **current password** (and optionally a step-up MFA)
before accepting a new one. This proves the person at the keyboard is the account owner
and not someone who walked up to an unlocked, already-authenticated session.

## When it's used

- Routine credential hygiene from a settings screen.
- A user who suspects their password leaked but is still able to log in.
- The forced-change step after an [admin reset](../admin-initiated-reset/README.md) or a
  [password expiry](../password-expiry-rotation/README.md) (there the "current" password
  is the temporary one).

## Actors

| Actor | Role |
|---|---|
| User | Logged-in human changing their own password |
| Browser | Renders the change form, carries the session cookie |
| IdP | Auth server / app: reauthenticates, validates policy, updates credential |
| Directory | User store where the password hash and history live |

## Alternate scenarios covered

- **Current password wrong** — reauthentication fails; the change is rejected and the
  attempt is counted (an attacker on a borrowed session cannot brute-force here).
- **New password rejected** — the new password equals the old one or matches an entry in
  the **password history**, or fails policy/breach checks, and is refused.
- **Step-up MFA before change** — for sensitive accounts, a valid session is not enough;
  a fresh MFA challenge is required immediately before the change is committed.

## Security notes

- **Reauthenticate:** always require the current password (a "sudo" moment). A live
  session should not by itself authorize changing the credential that protects it.
- **Password history:** keep hashes of the last N passwords and reject reuse; combine with
  a minimum-age policy to stop users cycling back to a favorite.
- **Breach + policy check** on the new password — see
  [breached-password-detection](../breached-password-detection/README.md).
- **Session decision after change:** offer to **keep the current session but kill all
  others**, or kill everything. A voluntary change should at minimum revoke *other*
  sessions so a change triggered by suspected compromise actually evicts the attacker.
  See [session-cookie](../../tokenless/session-cookie/README.md) and
  [RP-initiated logout](../../oidc/rp-initiated-logout/README.md).
- **Notify** the user out-of-band that the password changed.
- Compare the current-password input in constant time and rate-limit reauth failures.

## Diagrams

- [sequence.md](sequence.md) — reauth, policy/history/breach check, update, session handling, plus alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP, Directory.
- [flowchart.md](flowchart.md) — decision logic: reauth, step-up, history, policy, session choice.

## Related diagrams

- [self-service-reset](../self-service-reset/README.md) — for users who cannot log in and don't know the current password.
- [admin-initiated-reset](../admin-initiated-reset/README.md) — the reset that hands a temp password into this change flow.
- [password-expiry-rotation](../password-expiry-rotation/README.md) — the forced version of this change.
- [breached-password-detection](../breached-password-detection/README.md) — the breach check on the new password.
- [session-cookie](../../tokenless/session-cookie/README.md) — the sessions kept or killed after the change.
- [mfa-enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — where the step-up authenticator came from.
