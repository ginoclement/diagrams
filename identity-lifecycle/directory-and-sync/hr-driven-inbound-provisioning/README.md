---
title: "HR-Driven Inbound Provisioning"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HR-Driven Inbound Provisioning

**Status:** ✅ Current

## What it is

Inbound provisioning makes an **authoritative HR system** (Workday, SuccessFactors,
UKG, BambooHR) the source of record that drives account **create / update / disable** in
the identity system (Entra ID, on-prem AD, or an IGA platform). A provisioning engine
reads worker records from HR on a schedule (or event), applies a **scoping filter** and
**attribute mapping / transformations**, **matches** each worker to an existing account by
a stable anchor (typically `employeeID`), and then acts:

- **Joiner** — a new worker (reaching their effective hire date) triggers account
  **creation**, kicking off downstream [onboarding](../../user-lifecycle/joiner-onboarding/README.md).
- **Mover** — a change to department, job title, manager, or location updates the account
  and can drive [role/group changes](../group-membership-sync/README.md).
- **Leaver** — a termination date disables or deprovisions the account (handoff to
  [offboarding](../../user-lifecycle/leaver-offboarding/README.md)).

The engine tracks a **watermark** so each run processes only changes since the last run,
and quarantines records it cannot map cleanly rather than corrupting downstream state.

## When it is used

- Enterprises that want HR to be the single authoritative trigger for identity lifecycle,
  so "hired in Workday" automatically becomes "has an account" with no manual ticket.
- As the front end of a broader
  [joiner-mover-leaver orchestration](../../user-lifecycle/jml-orchestration/README.md),
  feeding correct attributes and timing into onboarding and access grants.
- Anywhere attribute accuracy matters downstream — job title and department flow into
  [group membership](../group-membership-sync/README.md) and access reviews.

## Actors

| Actor | Role |
|---|---|
| `HR` | Authoritative HR source of record; owns worker data and effective dates |
| `Prov` | Provisioning engine / connector; reads HR, maps, matches, writes |
| `Directory` | Target identity system (Entra ID / AD / IGA) where accounts live |
| `Downstream` | Apps and groups provisioned after the account exists |

## Key details

- **Scoping filter** decides which workers are in scope (e.g. active employees in certain
  legal entities); out-of-scope workers are skipped, not deleted.
- **Attribute mapping** transforms HR fields into directory attributes — e.g. build `UPN`
  and `displayName`, normalize department, resolve the manager reference by anchor.
- **Matching** joins an incoming worker to an existing account by a stable anchor
  (`employeeID` / `workerID`); a missing match means a Joiner, an existing match means an
  update. Ambiguous or duplicate matches are flagged, not guessed.
- **Effective-dated events**: creation is timed to the **hire date** (optionally pre-hire
  staging), disable to the **termination date**, so timing follows HR, not the sync clock.
- **Incremental sync** uses a watermark/cursor; **quarantine** isolates records that fail
  validation (missing required attribute, transform error) so one bad record does not stall
  the run.

## Alternate scenarios covered

- **Happy path (Joiner)** — new in-scope worker, no match, account created.
- **Mover** — existing worker's attributes changed, account updated, groups re-evaluated.
- **Leaver** — termination date reached, account disabled / deprovisioned.
- **Out-of-scope worker** — filtered out, no action.
- **Mapping / validation error** — required attribute missing or transform fails, record
  quarantined and reported.
- **Ambiguous match** — anchor matches multiple accounts, record flagged for manual review.

## Security notes

- HR is authoritative, so **feed integrity is a security control**: protect the connector
  credentials and the HR API scope; a poisoned HR feed could create or elevate accounts.
- Time disables to the real **termination date** and alert on disable failures — a Leaver
  that silently fails to deprovision is standing access risk.
- Least-privilege the provisioning engine's write scope in the target directory; it should
  create and update accounts, not hold broad admin.
- Keep an **audit trail** of every create/update/disable with the source HR event, and
  reconcile periodically to catch drift between HR and the directory.
- Quarantine rather than best-guess on ambiguous matches to avoid account takeover via
  anchor collision.

## Related diagrams

- [Joiner / Onboarding](../../user-lifecycle/joiner-onboarding/README.md) — the onboarding this provisioning triggers for a new hire
- [Mover / Role Change](../../user-lifecycle/mover-role-change/README.md) — the attribute-change path a Mover feeds
- [Leaver / Offboarding](../../user-lifecycle/leaver-offboarding/README.md) — the deprovisioning a termination date drives
- [JML Orchestration](../../user-lifecycle/jml-orchestration/README.md) — the end-to-end lifecycle this sits at the front of
- [SCIM Provisioning](../../user-lifecycle/scim-provisioning/README.md) — the outbound counterpart pushing accounts to SaaS apps
- [Group Membership Sync](../group-membership-sync/README.md) — how mapped attributes drive group and entitlement changes

## Files

- [sequence.md](./sequence.md) — read, map, match, and act with joiner/mover/leaver branches
- [swimlane.md](./swimlane.md) — lanes for HR, Prov, Directory, Downstream
- [flowchart.md](./flowchart.md) — per-record decision logic and error/quarantine terminals
