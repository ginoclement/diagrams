---
title: "ForgeRock IDM — Sync & Reconciliation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ForgeRock IDM — Sync & Reconciliation

**Status:** ✅ Current

**ForgeRock Identity Management (IDM)** synchronizes identities between a **repo /
authoritative source** and **external resources** (connected systems) through
connectors. It offers two complementary mechanisms:

- **Implicit sync** — the moment an object changes in the source (create/update/
  delete), IDM immediately pushes the mapped change out to each target resource. Also
  **liveSync** polls a resource's change log for near-real-time inbound changes.
- **Reconciliation (recon)** — a batch job that compares *all* source and target
  objects, computes a **situation** for each, and runs the mapping's configured
  **action** for that situation. Recon is the authoritative "make reality match
  policy" sweep; implicit sync keeps things current between recons.

Reconciliation classifies every correlated pair into a **situation**, e.g.:
`CONFIRMED` (linked, both exist, in sync), `FOUND` (target matches an unlinked
source), `MISSING` (link exists but target object is gone), `UNQUALIFIED` (source no
longer qualifies for the target per policy — typically **deprovision**), `UNASSIGNED`
(target object with no source — orphan), `ABSENT` (source qualifies but no target —
**create**), `AMBIGUOUS` (multiple correlation matches).

## What makes this ForgeRock-specific (vs generic provisioning)

Standard user provisioning can be done with
[SCIM](../../user-lifecycle/scim-provisioning/README.md) — not re-drawn here. What is
ForgeRock-specific is the **mapping + situation/action model**: the explicit
**situation matrix**, `CONFIRMED/MISSING/UNQUALIFIED/UNASSIGNED/ABSENT` classifications,
correlation queries, **implicit sync vs scheduled recon vs liveSync**, and links
stored in the IDM repo.

## When it is used

- Provisioning and deprovisioning accounts across HR, DS/LDAP, AD, databases, SaaS.
- Detecting and remediating drift (orphans, missing targets) on a schedule.
- Real-time propagation of joiner/mover/leaver changes via implicit sync + liveSync.

## Actors

| Actor | Role |
|---|---|
| Source | Authoritative source (HR feed) or the IDM managed repo |
| IDM | ForgeRock IDM: mappings, correlation, situation calculation, sync engine, scheduler |
| DS | ForgeRock Directory Services acting as repo and/or a target resource |
| Target | External connected resource (AD, database, SaaS) via a connector |

## Alternate scenarios covered

- **liveSync** — IDM polls a resource change log and applies inbound changes without
  a full recon.
- **Reconciliation situation matrix** — the full recon sweep computing a situation
  per object and running the mapped action.
- **Deprovision on UNQUALIFIED** — a source object that no longer qualifies triggers
  the `UNQUALIFIED` action (unlink / delete target).

## Related diagrams

- [SCIM Provisioning](../../user-lifecycle/scim-provisioning/README.md) — the standards-based provisioning alternative.
- [ForgeRock Authentication Journey](../forgerock-authentication-journey/README.md) — how the identities IDM manages then authenticate.
- [JML Orchestration](../../user-lifecycle/jml-orchestration/README.md) — joiner/mover/leaver events that drive sync.
- [Leaver / Offboarding](../../user-lifecycle/leaver-offboarding/README.md) — deprovisioning that maps to UNQUALIFIED.

## Files

- [sequence.md](sequence.md) — implicit sync on change and a scheduled recon computing situations; liveSync + deprovision alts.
- [swimlane.md](swimlane.md) — lanes for Source, IDM, DS, Target.
- [flowchart.md](flowchart.md) — the reconciliation situation matrix with per-situation actions.
