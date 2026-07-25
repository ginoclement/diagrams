---
title: "PIM Just-in-Time Role Elevation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PIM Just-in-Time Role Elevation

**Status:** ✅ Current

## What it is

Privileged Identity Management (PIM) makes privileged roles **eligible** instead of
**permanently active**. A user assigned an eligible role holds no standing privilege; to
use it they **activate** it just-in-time for a bounded window. Activation can require an
MFA (or authentication-context) challenge, a business justification, a ticket number, and
**approval** by a designated approver. On success PIM makes the assignment **active** for
a time-boxed duration (e.g. 1–8 hours), after which it automatically expires and privilege
is removed. This applies to Entra roles (e.g. Global Administrator), Azure resource roles
(RBAC), and PIM for Groups.

## When it is used

- Reducing standing access to high-impact roles (Global Admin, Privileged Role Admin,
  Owner/Contributor on subscriptions) — the core of Zero Standing Privilege.
- Any admin action that should be exceptional, audited, and time-limited rather than
  always-on.

## Actors

| Actor | Role |
|---|---|
| User | Eligible principal requesting activation |
| Portal | Entra / Azure portal or Graph API where activation is requested |
| PIM | Privileged Identity Management service enforcing rules and timing |
| Entra | Entra ID applying the active role assignment and issuing tokens |
| Approver | Person who approves or denies the activation request |
| API | Azure resource or Graph endpoint the elevated token is used against |

## Alternate scenarios covered

- Self-activation with MFA + justification, no approval required.
- Activation requiring approval — pending until an approver acts.
- MFA challenge at activation (step-up to authentication context).
- Denied or expired-without-approval request.
- Automatic deactivation at end of the time-bound window.
- Break-glass account excluded from PIM for emergency access.

## Security notes

- Eligible assignment grants **no** privilege until activated; a stolen session for an
  eligible admin still holds no admin rights until it passes activation controls.
- Require MFA and approval on the highest-impact roles; require justification and ticket
  binding for auditability.
- Pair PIM with [Conditional Access authentication context](../conditional-access-evaluation/README.md)
  so activation itself can demand a phishing-resistant factor and a compliant device.
- Access reviews should periodically recertify who remains eligible.
- Keep at least two break-glass accounts excluded from PIM/CA, stored offline, and
  monitored for any sign-in.

## Related diagrams

- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — auth-context step-up enforced at activation
- [Continuous Access Evaluation](../continuous-access-evaluation/README.md) — revokes the elevated token when eligibility ends
- [Windows Hello for Business](../windows-hello-for-business/README.md) — a phishing-resistant factor for the activation MFA
- [Privileged access](../../../privileged-access/README.md) — where admin activation should happen
- [OIDC Authorization Code + PKCE](../../../oidc/authorization-code-pkce/README.md) — the token flow that carries the activated role

## Files

- [sequence.md](sequence.md) — eligible-to-active activation with approval and MFA alternates
- [swimlane.md](swimlane.md) — lanes for User, Portal, PIM, Entra, Approver, API
- [flowchart.md](flowchart.md) — activation rule gates and deny/expiry terminals
