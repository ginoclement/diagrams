# JML Orchestration — Lifecycle Overview

## Purpose

This is the **high-level overview** that ties the whole category together. Rather than
re-drawing the joiner, mover, and leaver flows, it shows how a single **HR source of truth**
and a central **IGA engine** drive all three transitions into a shared **IdP** and shared
**downstream applications** — and how the ongoing
[access-review](../access-review-certification/README.md) control wraps around them. Read
this first for the big picture, then drill into each linked flow for detail.

The core idea of JML orchestration is that identity is **event-driven and attribute-based**:
HR is authoritative for *who exists and what they are*; IGA is authoritative for *what
access that implies*; the IdP and apps are the *targets* that get provisioned. Every joiner,
mover, and leaver is the same pattern — an HR event, an IGA re-evaluation, and a set of
provisioning/deprovisioning actions — differing only in what the re-evaluation decides.

## When it's used

- Designing or explaining an identity governance architecture end to end.
- Onboarding engineers/auditors to how HR, IGA, IdP, and apps relate.
- Deciding where a new requirement belongs (which transition, which control).

## Actors

| Actor | Role |
|---|---|
| `HR` | Source of truth — emits joiner / mover / leaver events |
| `IGA` | Governance engine — the decision and orchestration hub |
| `IdP` | Identity provider / directory — the account authority |
| `App` | Downstream applications — provisioning targets |
| `Reviewer` | Manager / owner participating in approvals and certifications |

## The three transitions (each a full diagram)

- **Joiner** → [joiner-onboarding](../joiner-onboarding/README.md): create identity, grant
  birthright + RBAC, provision apps, issue credentials.
- **Mover** → [mover-role-change](../mover-role-change/README.md): re-evaluate access on an
  attribute change; add new and revoke stale, gated by SoD.
- **Leaver** → [leaver-offboarding](../leaver-offboarding/README.md): disable, revoke
  sessions/tokens, deprovision, reclaim, archive, delete after retention.

Underpinned by [scim-provisioning](../scim-provisioning/README.md) (the wire protocol) and
backstopped by [access-review-certification](../access-review-certification/README.md) (the
periodic control that catches drift the events missed).

## Alternate scenarios covered

- **Event ordering / out-of-order events** — a leaver event arriving before a pending mover
  completes; IGA reconciles to the latest authoritative state.
- **Rehire** — a joiner event matching a retained disabled identity routes to re-enable
  rather than net-new creation.
- **Reconciliation sweep** — IGA periodically compares target state (from HR + policy)
  against actual state (in IdP + apps) and remediates drift, including orphaned accounts.

## Related diagrams

- [joiner-onboarding](../joiner-onboarding/README.md), [mover-role-change](../mover-role-change/README.md), [leaver-offboarding](../leaver-offboarding/README.md) — the three transitions in detail.
- [scim-provisioning](../scim-provisioning/README.md) — the protocol connecting IGA to apps.
- [access-review-certification](../access-review-certification/README.md) — the wrap-around governance control.
- [Identity Provider reference architecture](../../architecture/identity-provider-reference-architecture/README.md) — the platform these components live in.
- [RP-Initiated Logout](../../oidc/rp-initiated-logout/README.md) / [Session Cookie](../../tokenless/session-cookie/README.md) — the runtime sessions leaver events must terminate.

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — high-level event-to-provisioning exchange across transitions
- [swimlane.md](swimlane.md) — HR / IGA / IdP / App / Reviewer lanes across the lifecycle
- [flowchart.md](flowchart.md) — event-routing decision logic to the right transition
