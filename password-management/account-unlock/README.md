# Account Unlock

Recovering an account that has been **locked out** after too many failed login attempts.
Lockout is a brute-force defense; unlock restores access **without necessarily resetting
the password**. The user proves identity (typically MFA or a recovery factor), the account
is unlocked, and the **failure counter is reset**. Repeated lockouts are a signal of an
ongoing attack and should escalate.

The distinction from [self-service reset](../self-service-reset/README.md) matters: the
user may still **know** their password — they were merely rate-limited — so forcing a full
reset is often unnecessary and only trains users toward weaker passwords.

## When it's used

- A user fat-fingered their password past the lockout threshold and is temporarily blocked.
- An attacker's brute-force attempt locked a victim's account (denial of service via
  lockout), and the legitimate user needs back in.
- After an [expiry](../password-expiry-rotation/README.md) or reset flow where too many
  bad attempts tripped the lock.

## Actors

| Actor | Role |
|---|---|
| User | Locked-out human seeking to regain access |
| Browser | Renders the unlock UI and MFA challenge |
| IdP | Auth server: detects lockout, verifies identity, unlocks, resets counter |
| Directory | User store holding the lockout state and failure counter |
| RecoverySvc | Sends unlock OTP / notification |
| Admin | Optional: performs an administrative unlock |

## Alternate scenarios covered

- **Auto-unlock after timeout** — many policies clear the lock automatically after a
  cool-down window (e.g. 15 minutes) with no user action; the counter resets on its own.
- **Admin unlock** — a helpdesk agent unlocks the account after
  [verifying the caller](../admin-initiated-reset/README.md), without changing the password.
- **Repeated lockout — escalate/flag** — if the same account locks repeatedly in a short
  window, treat it as a probable attack: raise a security alert, require a full MFA-backed
  reset, or extend the cool-down (exponential backoff).

## Security notes

- **Unlock is not the same as reset.** Restore access after identity proof; force a
  password change only when compromise is suspected (repeated lockouts, breach signal).
- **Verify identity before unlocking**, ideally with MFA. An unauthenticated "unlock"
  endpoint that only needs a username would hand attackers a lock-clearing oracle.
- **Reset the failure counter** on successful unlock so the user is not immediately
  re-locked; on auto-unlock, reset it at the end of the cool-down.
- **Uniform, rate-limited responses** on the unlock request so it cannot be used to
  enumerate which accounts are currently locked.
- **Escalate repeated lockouts** — exponential backoff on the cool-down and a security
  alert; a persistent lock pattern is an attack indicator, not user clumsiness.
- Consider that aggressive lockout is itself a **DoS vector** — an attacker can lock out
  known usernames. Prefer throttling/backoff and MFA over hard permanent locks.

## Diagrams

- [sequence.md](sequence.md) — detect lock, verify MFA, unlock, reset counter, plus alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP, Directory, RecoverySvc, Admin.
- [flowchart.md](flowchart.md) — decision logic: locked? auto-unlock vs identity proof, repeat-lock escalation.

## Related diagrams

- [self-service-reset](../self-service-reset/README.md) — when the user also needs a new password.
- [admin-initiated-reset](../admin-initiated-reset/README.md) — the admin unlock / reset path with caller verification.
- [password-expiry-rotation](../password-expiry-rotation/README.md) — another gate that can block login.
- [session-cookie](../../tokenless/session-cookie/README.md) — where the failed-attempt counter and lockout are enforced.
- [mfa-enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — the MFA factor used to prove identity for unlock.
