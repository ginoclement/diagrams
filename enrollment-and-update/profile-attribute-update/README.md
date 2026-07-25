---
title: "Profile Attribute Update (Self-Service)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Profile Attribute Update (Self-Service)

**Status:** ✅ Current

A user updates their own profile attributes. **Non-sensitive** attributes (display name,
locale, avatar) commit immediately. **Sensitive** attributes — email, phone, recovery
contacts, and anything security-relevant — require **step-up re-authentication** and, when
the new value is a contact channel, **re-verification** before the change is committed.
**Admin-restricted** attributes (employee ID, group membership, entitlements) are rejected
for self-service and can only be changed through governed lifecycle processes.

## When it's used

- Self-service profile management in an IdP/account portal.
- Changing an email/phone/recovery method that protects the account (and therefore gates
  password reset and MFA).
- Enforcing that a user re-proves identity before altering security-critical data.

## Actors

| Actor | Role |
|---|---|
| User | Edits their profile, re-authenticates when challenged, confirms new values |
| Browser | Hosts the profile UI, submits changes, runs the step-up prompt |
| IdP Server | Classifies attributes, enforces step-up, commits or rejects, writes to the directory |
| Directory | System of record storing the attributes |
| Verification Service | Delivers proof for re-verifying a new contact channel |

## Alternate scenarios covered

- **Non-sensitive attribute** — validated and committed immediately, no step-up.
- **Sensitive attribute requires step-up** — a fresh re-authentication (or strong factor)
  is required before the change is accepted.
- **Verification of the new value** — a new email/phone must be verified before it
  replaces the old one; until then the old value stays authoritative.
- **Admin-restricted attribute rejected** — self-service edits to governed attributes are
  refused and pointed at the proper request/lifecycle process.

## Security notes

- Classify every attribute as non-sensitive / sensitive / admin-restricted **server-side**;
  never let the client decide which gate applies.
- Require **fresh** re-authentication (recent auth time or an explicit step-up), not merely
  an active session, for sensitive changes.
- Do not commit a new contact channel until it is verified — otherwise an attacker who
  briefly controls a session could redirect recovery to their own address.
- Log and, where appropriate, **notify the old channel** when a sensitive attribute
  changes, so the legitimate user can detect account takeover.

## Diagrams

- [sequence.md](sequence.md) — non-sensitive immediate commit; sensitive step-up + re-verification; admin-restricted rejection.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP Server, Directory, Verification Service.
- [flowchart.md](flowchart.md) — attribute-classification, step-up, verification, and commit decision logic.

## Related diagrams

- [Email / phone verification](../email-phone-verification/README.md) — the re-verification sub-flow for a new contact channel.
- [MFA enrollment](../mfa-enrollment/README.md) — the same step-up-before-sensitive-change gate.
- [Self-service password reset](../../password-management/self-service-reset/README.md) — protected by the recovery contacts changed here.
- [Mover role change](../../user-lifecycle/mover-role-change/README.md) — how admin-restricted attributes change through governance instead.
