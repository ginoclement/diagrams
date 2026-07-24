# Password Management

Diagrams for the **lifecycle of a password credential** after it exists: recovering it
when forgotten, changing it deliberately, rotating it when expired, screening it against
breach corpora, and recovering from lockout. These flows are where identity systems are
most often attacked *around* the login itself — password reset is a classic account-takeover
vector, and helpdesk resets are the textbook social-engineering target — so each diagram
emphasizes the security nuance that makes the flow safe rather than just the mechanics.

Cross-cutting themes throughout this category:

- **Account-enumeration resistance** — uniform responses and constant timing so reset and
  unlock endpoints never reveal which accounts exist.
- **Session invalidation** — a reset or compromise-driven change must evict existing
  sessions and tokens, not just update a hash.
- **Anti-social-engineering** — admin/helpdesk actions require verifying the caller before
  any credential is issued.
- **k-anonymity** — breach screening checks a candidate password without ever sending it
  (or its full hash) off the server.

## Diagrams

- [self-service-reset](self-service-reset/README.md) — user-driven "forgot password": identify account, verify a recovery factor, set a new policy-compliant password, invalidate old sessions, with enumeration protection and MFA-backed variants.
- [admin-initiated-reset](admin-initiated-reset/README.md) — helpdesk/admin resets another user's password: authorize the admin, verify the caller out-of-band, issue a temp password or link, force change at next login, notify and audit.
- [password-change-authenticated](password-change-authenticated/README.md) — a logged-in user changes their own password: reauthenticate with the current password, enforce policy and history, optionally step-up MFA, and keep or kill other sessions.
- [password-expiry-rotation](password-expiry-rotation/README.md) — expired or must-change-at-next-login: detect at login, withhold the session, force a compliant change, with grace logins, pre-expiry warnings, and admin force-expire.
- [breached-password-detection](breached-password-detection/README.md) — screen a candidate password against a breach corpus using k-anonymity (SHA-1 prefix range query, local suffix match), with count-threshold and offline bloom-filter variants.
- [account-unlock](account-unlock/README.md) — self-service recovery after lockout: verify identity/MFA, unlock without necessarily resetting the password, reset the failure counter, with auto-unlock, admin unlock, and repeat-lockout escalation.

## Related categories

- [tokenless/](../tokenless/) — the session-cookie and passwordless login flows these credentials protect.
- [oidc/](../oidc/) — federated login and [RP-initiated logout](../oidc/rp-initiated-logout/README.md) used for session revocation.
- [enrollment-and-update/](../enrollment-and-update/) — how the MFA and recovery factors used here get registered.
- [user-lifecycle/](../user-lifecycle/) — joiner/mover/leaver credential events around these flows.
- [architecture/](../architecture/) — where the auth server, directory, and audit log that back these flows sit.
