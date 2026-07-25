# Access Review by Persona

**Status:** ✅ Current

## What it is

Access recertification (attestation) asks a reviewer to confirm that a principal still needs
the access it holds. The *mechanics* are shared — a campaign enumerates grants, a reviewer
decides certify/revoke, revocations flow to fulfillment — but the **cadence, the approver,
and the default decision** differ materially by persona. This set overlays the personas so
those forks are visible side by side:

- **Standard employee (Workforce)** — periodic cadence (e.g. quarterly/annual), the
  **line manager** attests, default is to certify low-risk entitlements; often role-based so
  reviews target exceptions.
- **Contractor** — **shorter cadence** tied to the engagement/contract end date, the
  **sponsoring manager** attests, and access **auto-expires** if not explicitly renewed
  (deny-by-default on lapse).
- **Privileged** — **frequent** cadence (e.g. monthly) or continuous, reviewed by a
  **resource owner plus security**, with tighter separation-of-duties and a bias to revoke
  anything not actively justified; standing privilege is the thing under scrutiny.
- **Workload** (non-human) — service accounts and machine identities reviewed by their
  **owning team**, focused on unused permissions and stale credentials.

It does not redraw the base certification flow — it references it and shows only what the
persona changes.

## Actors

| Actor | Role |
|---|---|
| `Campaign` | Identity governance (IGA) engine that generates and tracks the review |
| `Reviewer` | The attester: line manager, sponsoring manager, resource owner, security, or workload owner |
| `Subject` | The principal whose access is under review (employee, contractor, privileged operator, workload) |
| `Source` | Authoritative source of truth: HR for cadence/status, contract system for end dates |
| `Fulfillment` | Provisioning/SCIM target that revokes access on a "revoke" decision |

## Alternate scenarios covered

Each persona is an `alt` branch in the sequence, a lane group in the swimlane, and a
top-level decision branch in the flowchart:

- **Standard employee** — periodic manager attestation, certify/revoke, revocations fulfilled.
- **Contractor** — engagement-bound cadence, sponsor attestation, auto-revoke on end-date lapse.
- **Privileged** — frequent dual review (owner + security), bias to revoke, SoD enforced.
- **Workload** — owner review of unused permissions and stale keys.

## Security notes

- Match **cadence to risk**: privileged and contractor access must be reviewed more often than
  standard employee access. A one-size annual cadence leaves high-risk grants stale.
- Pick the **right approver**: a manager can attest business need, but privileged entitlements
  need the **resource owner and security**, not just the line manager (avoid rubber-stamping).
- **Deny by default on lapse** for contractors and privileged: if a review is not completed by
  the deadline, revoke rather than extend. Never let a missed review silently renew access.
- Enforce **separation of duties**: a reviewer must not certify their own access or an approver
  in their own chain of benefit.
- Capture **evidence and justification** for every certify decision; "certified" without a
  reason is not an audit trail. Feed revocations straight to fulfillment so decisions take effect.
- Treat **workload/service-account** review as first-class: unused permissions and stale keys
  are a common breach path and are easy to overlook because no human "owns" the login.

## Related diagrams

- [user-lifecycle/access-review-certification](../../user-lifecycle/access-review-certification/README.md) — the base recertification campaign flow.
- [user-lifecycle/mover-role-change](../../user-lifecycle/mover-role-change/README.md) — role change that triggers ad-hoc review.
- [user-lifecycle/leaver-offboarding](../../user-lifecycle/leaver-offboarding/README.md) — the auto-revoke endpoint for lapsed contractor/leaver access.
- [privileged-access/jit-privilege-elevation](../../privileged-access/jit-privilege-elevation/README.md) — JIT reduces standing privilege under review.
- [Personas reference](../README.md) — archetypes and full variance matrix.

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — per-persona `alt` message exchange
- [swimlane.md](swimlane.md) — lanes with a persona router
- [flowchart.md](flowchart.md) — persona-type decision tree
