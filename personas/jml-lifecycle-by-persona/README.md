# JML Lifecycle by Persona

**Status:** ✅ Current

## What it is

The joiner / mover / leaver lifecycle is the flow that forks **hardest** by persona, because
what forks is the most fundamental question: **who masters the identity**. The base
[JML Orchestration](../../user-lifecycle/jml-orchestration/README.md) assumes an HR source of
truth and an IGA engine; that assumption only holds for employees. This set overlays four
mastering models:

- **Employee (Workforce)** — HR is authoritative; classic joiner→mover→leaver driven by HR events.
- **Contractor** — a **sponsor** (not HR) masters the identity; there is a **hard expiry**,
  and re-verification is required to extend rather than an open-ended tenure.
- **Partner/B2B** — the identity is mastered by an **external organization**; there is **no
  local mastering**. Local IGA only grants and revokes access at the trust boundary; the
  "leaver" event is the partner offboarding or the invitation expiring.
- **Workload** — an **owner** attests the identity. It has no "mover"; it has **rotation**.
  It has no "leaver"; it has **decommission**. Lifecycle is about credential currency and
  ownership, not roles and terminations.

It references the base lifecycle diagrams for the mechanics and shows only the per-persona divergence.

## Actors

| Actor | Role |
|---|---|
| `Source` | Mastering authority: HR, sponsor, external org, or workload owner |
| `IGA` | Governance engine — evaluates target state and orchestrates provisioning |
| `IdP` | IdP / directory — the account authority |
| `App` | Downstream provisioning target |
| `Owner` | Workload owner attesting need and rotation |

## Alternate scenarios covered

- **Employee (HR-driven)** — joiner→mover→leaver on HR events; retention then delete.
- **Contractor (sponsor + hard expiry)** — sponsor creates, hard expiry auto-disables,
  extension requires sponsor re-attestation.
- **Partner (external org, no local mastering)** — access granted at boundary; removed on
  partner offboard, invite expiry, or trust revocation — never a local termination event.
- **Workload (owner-attested)** — register → rotate credentials → **decommission** (not
  "leaver"); no role changes, so no "mover".

## Security notes

- The **hard expiry** on contractors is a control, not a convenience: an identity with no
  natural end state (no HR "termination" event) must have a deadline so it fails closed.
- For partners, never mirror the partner's HR into your directory — you cannot keep it
  current. Bind access to a **live** federated assertion and a local expiry so a stale
  external account cannot linger after the partner offboards the user.
- Workloads have no leaver signal from a person, so **orphaned-credential** risk is high;
  require an owner, an attestation cadence, and a decommission runbook that revokes secrets
  and certs, not just the account.
- Reconciliation (target-vs-actual sweep) is the backstop for every persona, but it matters
  most where events are unreliable — partners and workloads.
- Rehire, out-of-order events, and orphan remediation behave as in the base
  [JML Orchestration](../../user-lifecycle/jml-orchestration/README.md); persona changes the
  *source and end-state semantics*, not the reconciliation machinery.

## Related diagrams

- [JML Orchestration](../../user-lifecycle/jml-orchestration/README.md) — the base lifecycle this set forks
- [Joiner Onboarding](../../user-lifecycle/joiner-onboarding/README.md) / [Mover Role Change](../../user-lifecycle/mover-role-change/README.md) / [Leaver Offboarding](../../user-lifecycle/leaver-offboarding/README.md) — the transitions in detail
- [SCIM Provisioning](../../user-lifecycle/scim-provisioning/README.md) — the wire protocol to apps
- Access Review by Persona *(planned)* — the periodic control that catches drift these events miss
- [Personas reference](../README.md) — archetypes and variance matrix

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — per-persona `alt` event-to-provisioning exchange
- [swimlane.md](swimlane.md) — Source / IGA / IdP / App lanes with a persona router
- [flowchart.md](flowchart.md) — mastering-model decision tree
