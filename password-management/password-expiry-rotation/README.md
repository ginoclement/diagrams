---
title: "Password Expiry and Rotation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Password Expiry and Rotation

**Status:** ✅ Current

Handling a login where the password has **expired** or is flagged
**must-change-at-next-login**. The user authenticates successfully with the old (still
valid-for-identification) password, but before a full session is granted the system
**forces a password change**. The new password must pass the usual policy, history, and
breach checks. Common triggers are a maximum-age policy, an admin
[force-expire](../admin-initiated-reset/README.md), or the temporary credential issued by
a reset.

Note: modern guidance (NIST SP 800-63B) discourages **routine** time-based expiry and
recommends forcing a change only on **evidence of compromise**. This diagram documents
the mechanism, which remains widely deployed and is still needed for the
compromise-driven case.

## When it's used

- An organization enforces a maximum password age (e.g. 90 days) — legacy but common.
- Security forces rotation of a credential believed to be exposed.
- The first login after an admin reset, where the temporary password must be replaced.
- A grace period after expiry where a limited number of logins remain before hard lockout.

## Actors

| Actor | Role |
|---|---|
| User | Human logging in with an expired or must-change credential |
| Browser | Renders login and the forced-change form |
| IdP | Auth server: detects expiry, blocks session, forces change |
| Directory | User store holding the password, its age, and the must-change flag |

## Alternate scenarios covered

- **Grace logins remaining** — after expiry the user may be allowed N warning logins that
  still nag but grant access; once exhausted, change is mandatory before any access.
- **Pre-expiry warning banner** — before expiry, successful logins show a "password
  expires in X days" banner but proceed normally.
- **Admin force-expire** — an admin sets must-change on the account, causing this flow on
  the next login even though the age limit has not elapsed.

## Security notes

- **Block the session until the change completes.** The old credential authenticates the
  user for the purpose of the change only; do not issue a normal session cookie or token
  before the new password is set.
- **Full policy + breach + history checks** on the new password, identical to
  [password-change-authenticated](../password-change-authenticated/README.md).
- **Reuse the change plumbing:** an expiry-forced change is a normal authenticated change
  where the "current" password is the expired one.
- **Revoke stale sessions** issued under the old password where the rotation is
  compromise-driven — see [session-cookie](../../tokenless/session-cookie/README.md).
- **Prefer risk-based rotation** over calendar-based: forced rotation trains users to pick
  weak, incremental passwords (`Spring2026!` -> `Summer2026!`). Pair any age policy with
  breach detection so rotation is meaningful.

## Diagrams

- [sequence.md](sequence.md) — login, expiry detection, forced change before session grant, plus alts.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP, Directory.
- [flowchart.md](flowchart.md) — decision logic: expired? grace left? warn vs force, policy check.

## Related diagrams

- [password-change-authenticated](../password-change-authenticated/README.md) — the change mechanism reused here.
- [admin-initiated-reset](../admin-initiated-reset/README.md) — sets the must-change flag and issues the temp password.
- [breached-password-detection](../breached-password-detection/README.md) — the breach check that should replace blind calendar rotation.
- [self-service-reset](../self-service-reset/README.md) — the path for a user who cannot supply the expired password.
- [session-cookie](../../tokenless/session-cookie/README.md) — the session that is withheld until the change completes.
