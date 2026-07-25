---
title: "Access Review & Certification"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Access Review & Certification

**Status:** ✅ Current

## Purpose

**Access review (recertification)** is the periodic detective control that answers "does
everyone who has access still deserve it?" Where the [mover](../mover-role-change/README.md)
flow is *preventive* (fix access at the moment of change), certification *catches what the
event-driven flows missed*: privilege creep, access granted by exception and never removed,
orphaned entitlements, and drift. The **IGA engine** generates a **campaign** — a batch of
review items pairing each user (or role/entitlement) with a **reviewer** (usually the
line manager or the resource owner) — and each reviewer must **certify** (keep) or
**revoke** each item. Revocations flow into remediation, which deprovisions the access via
the same machinery as [leaver offboarding](../leaver-offboarding/README.md).

Auditors love certifications because they produce evidence: a signed, timestamped record
that a responsible human affirmatively decided each access grant is still appropriate.
Regulations like SOX and ISO 27001 effectively mandate them.

## When it's used

- Scheduled campaigns (quarterly, semi-annual) covering a scope of users or entitlements.
- Event-triggered micro-certifications (e.g. after a mover event, re-review retained
  access; after ownership change, re-attest a resource).
- High-risk / privileged access reviewed on a tighter cadence than baseline access.

## Actors

| Actor | Role |
|---|---|
| `IGA` | Generates the campaign, tracks decisions, drives remediation |
| `Reviewer` | Manager or resource owner who certifies or revokes each item |
| `IdP` | Applies revocations to accounts / group memberships |
| `App` | Downstream application where revoked entitlements are removed |

## Key concepts

- **Campaign** — a scoped, time-bounded batch of review items with a deadline.
- **Certify** — affirm the access is still needed; the item is closed as approved.
- **Revoke** — mark access for removal; the item feeds remediation/deprovisioning.
- **Auto-revoke on no-response** — items left undecided at the deadline default to revoke
  (secure default) rather than silently keeping access.
- **Delegation** — a reviewer reassigns items to a more knowledgeable delegate.

## Alternate scenarios covered

- **Bulk approve** — a reviewer certifies many low-risk items at once (with the caveat that
  rubber-stamping undermines the control).
- **Delegated review** — a reviewer reassigns some or all items to a delegate.
- **Auto-revoke on no response** — undecided items at the deadline are revoked by default.
- **Revocation triggers deprovision** — a revoke decision hands off to the deprovisioning
  path shared with the leaver flow.

## Alternate & related flows

- [mover-role-change](../mover-role-change/README.md) — the preventive counterpart; certification is the detective backstop.
- [leaver-offboarding](../leaver-offboarding/README.md) — remediation reuses this deprovisioning path.
- [scim-provisioning](../scim-provisioning/README.md) — how a revocation is pushed to apps.
- [jml-orchestration](../jml-orchestration/README.md) — where governance controls sit around the lifecycle.

## Related diagrams

- [Identity Provider reference architecture](../../../infrastructure/architecture/identity-provider-reference-architecture/README.md) — where the governance/attestation engine sits in the platform.

## Files

- [README.md](./README.md) — this document
- [sequence.md](./sequence.md) — campaign lifecycle exchange
- [swimlane.md](./swimlane.md) — responsibilities per actor lane
- [flowchart.md](./flowchart.md) — per-item certify/revoke decision logic
