# Just-In-Time Privilege Elevation

**Status:** ✅ Current

## What it is

Instead of permanently assigning an administrator a privileged role, the identity is made
**eligible** for it. The privilege sits dormant until the person **activates** it —
supplying a justification, passing a fresh authentication/MFA challenge, and (for
sensitive roles) waiting for **approval**. Activation grants the role for a **bounded
window**; when the window expires the assignment is **automatically revoked** and the
identity returns to zero standing privilege. The canonical product implementation is
Microsoft Entra Privileged Identity Management (PIM); the same pattern exists in AWS
(temporary role assumption with permission-set activation), GCP, and third-party PAM.

## When it is used

- Administrative roles (Global Admin, subscription Owner, security operators) that are
  needed occasionally but rarely continuously.
- Reducing **standing privilege** so a compromised admin account is usually *not*
  currently privileged, shrinking the attack window.
- Satisfying separation-of-duties and access-review mandates: every elevation is a
  discrete, justified, time-boxed, logged event.

## Actors

| Actor | Role |
|---|---|
| User | Eligible administrator requesting activation |
| PIM | Privileged Identity Management service: holds eligible assignments, enforces activation policy, schedules revocation |
| Approver | Human who authorizes activation of sensitive roles |
| Directory | Identity provider / role store where the active assignment is written and later removed |
| Target | The resource the elevated role grants access to (tenant, subscription, project) |

## Alternate scenarios covered

- **Approval-required activation** — high-tier roles pause for an approver before the role
  is granted.
- **Auto-approved activation** — lower-tier roles activate immediately after MFA + justification.
- **MFA step-up on activation** — a fresh, phishing-resistant challenge is required at
  activation even if the sign-in session is recent.
- **Time-bound expiry / auto-revoke** — the assignment is removed automatically at the end
  of the window with no user action.
- **Early deactivation** — the admin ends elevation manually when finished.
- **Denied activation** — policy conditions (risk, location, missing justification, ticket
  mismatch) block the request.

## Security notes

- **Eligibility is not access.** The whole value is that the standing state is
  unprivileged; audit that eligible assignments are not silently converted to permanent.
- Require a **fresh, phishing-resistant MFA** at activation, not merely a valid session —
  activation is the moment privilege is actually conferred.
- Keep windows **short and scoped**: activate the least role, for the least time, on the
  least scope needed; auto-revoke must be reliable and monitored.
- Feed activations into **alerting and access reviews** — an unusual activation (odd hour,
  new approver, risky sign-in) should be visible in real time.
- Combine with a **change ticket / justification** binding so each elevation maps to a
  reason, and periodically recertify who remains *eligible*.

## Related diagrams

- [cloud-iam/entra/pim-jit-elevation](../../cloud-iam/entra/pim-jit-elevation/README.md) — the concrete Entra PIM implementation of this pattern.
- [credential-vault-checkout](../credential-vault-checkout/README.md) — the alternative when the privilege is a *shared secret* rather than a role on your own identity.
- [break-glass-emergency-access](../break-glass-emergency-access/README.md) — the pre-provisioned exception for when PIM/approval flows themselves are unavailable.
- session-recording-monitoring *(planned)* — what an elevated session is often routed through.

## Files

- [sequence.md](sequence.md) — eligible → request → (approval) → time-bound activation → auto-revoke, plus denied and early-deactivation alternates.
- [swimlane.md](swimlane.md) — lanes for User, PIM, Approver, Directory, Target.
- [flowchart.md](flowchart.md) — activation policy gates and revocation with explicit deny terminals.
