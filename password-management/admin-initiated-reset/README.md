# Admin-Initiated Password Reset

A **helpdesk or administrator** resets another user's password on the user's behalf —
the typical response to a support call ("I'm locked out and can't get the reset email").
The admin authenticates and is authorized for the action, the system issues a
**temporary password or a reset link**, the user is **forced to change it at next
login**, and everything is **audited** and the user is **notified**.

The dominant risk here is **social engineering**: an attacker phones the helpdesk
pretending to be the user. The flow therefore centers on **verifying the caller's
identity** before any credential is issued.

## When it's used

- A user has lost all self-service recovery factors and cannot run
  [self-service reset](../self-service-reset/README.md).
- Onboarding: setting an initial credential for a newly created account.
- Incident response: forcibly rotating a credential the security team believes is
  compromised.

## Actors

| Actor | Role |
|---|---|
| Admin | Helpdesk agent or administrator performing the reset |
| IdP | Identity provider / admin console: enforces admin authz, issues credential |
| Directory | User store where the target account's password is updated |
| RecoverySvc | Notification service: emails the temp password/link and the alert to the user |
| User | The account owner, notified and forced to change at next login |

## Alternate scenarios covered

- **Caller identity verification (social-engineering defense)** — before resetting, the
  admin must verify the caller out-of-band (knowledge questions, manager callback,
  in-person ID, or a pre-registered verification factor). Failure aborts the reset.
- **Temporary password vs. emailed link** — either a one-time temporary password (spoken
  or shown once) or a single-use reset link; both are time-limited and force a change.
- **Force-logout everywhere** — on reset, all of the target user's existing sessions and
  tokens are revoked so a resident attacker is evicted.

## Security notes

- **Authorize the admin, not just authenticate:** the acting admin must hold a role that
  permits resetting *this* user (respect delegated-admin scopes and tenant boundaries).
- **Verify the caller before touching the account.** The most common real-world breach of
  this flow is a helpdesk resetting for an impostor. Log the verification method used.
- **Force change at next login:** the temporary credential is a bootstrap, never a
  durable password. Mark the account `mustChangePassword` so the first login redirects
  into [password-change-authenticated](../password-change-authenticated/README.md).
- **Short TTL + single use** for temp passwords and links.
- **Notify the real user out-of-band** ("an admin reset your password") so an
  unauthorized reset is noticed even if the account is taken over.
- **Revoke sessions** — see [session-cookie](../../tokenless/session-cookie/README.md)
  and [RP-initiated logout](../../oidc/rp-initiated-logout/README.md).
- **Audit immutably:** who reset, for whom, when, verification method, from where.

## Diagrams

- [sequence.md](sequence.md) — admin auth, caller verification, credential issuance, forced change, audit.
- [swimlane.md](swimlane.md) — lanes for Admin, IdP, Directory, RecoverySvc, User.
- [flowchart.md](flowchart.md) — decision logic: admin authz, caller verification, temp vs link, force change.

## Related diagrams

- [self-service-reset](../self-service-reset/README.md) — the user-driven equivalent, preferred where possible.
- [password-change-authenticated](../password-change-authenticated/README.md) — the forced change the temp credential leads into.
- [account-unlock](../account-unlock/README.md) — admin unlock without necessarily resetting the password.
- [leaver-offboarding](../../user-lifecycle/leaver-offboarding/README.md) — deprovisioning, the inverse admin credential action.
- [identity-provider-reference-architecture](../../architecture/identity-provider-reference-architecture/README.md) — where the admin console and audit log sit.
