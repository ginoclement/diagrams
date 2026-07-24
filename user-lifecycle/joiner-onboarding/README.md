# Joiner — Onboarding & Birthright Provisioning

## Purpose

The **joiner** flow turns a new hire recorded in the HR source of truth into a working,
access-ready identity. An HR event (a new worker record reaching an active/hired state)
is picked up by the **IGA engine**, which creates an authoritative identity, drives
account creation in the **IdP**, computes **birthright access** (the baseline every worker
in a given department/location/job gets automatically) plus any **role-based (RBAC)**
entitlements, and provisions each **downstream application** — typically over
[SCIM](../scim-provisioning/README.md). Finally the worker receives credentials and an
enrollment invitation so they can log in on day one.

Birthright access is *automatic and un-requested*: it is the floor of access implied by
who you are (e.g. everyone gets email, the intranet, and the corporate directory). Access
beyond that floor is granted through roles, access requests, or the
[mover](../mover-role-change/README.md) flow later.

## When it's used

- A new full-time employee is hired and their HR record activates on the start date.
- A **pre-hire / early-start** identity must exist *before* day one (equipment, training,
  email) — provisioned in a limited state ahead of the official start date.
- A **contingent worker** (contractor, vendor, intern) is onboarded, usually from a
  separate feed and with a mandatory end date / sponsor.
- Bulk onboarding during acquisitions or seasonal hiring.

## Actors

| Actor | Role |
|---|---|
| `HR` | HR / HCM system — authoritative source of truth for worker records |
| `IGA` | Identity Governance engine — computes and orchestrates access |
| `IdP` | Identity Provider / directory where the login account is created |
| `App` | Downstream application provisioned via SCIM or a connector |
| `Manager` | Approver for privileged or exception birthright grants |
| `Worker` | The new joiner receiving credentials |

## Key concepts

- **Source of truth** — HR owns worker attributes (department, job code, location,
  manager, start/end date, worker type). IGA treats these as read-only inputs.
- **Birthright access** — baseline entitlements auto-granted from attributes, no request
  needed.
- **RBAC** — roles bundle entitlements; assignment is driven by attributes or requests.
- **Provisioning** — pushing account + entitlement state into IdP and apps, generally via
  SCIM 2.0 `POST /Users` and group membership changes.

## Alternate scenarios covered

- **Pre-hire / early-start** — identity created ahead of start date in a staged/disabled
  state, then activated on day one.
- **Contingent worker** — separate worker type carrying a hard end date and sponsor; a
  narrower birthright set.
- **Provisioning failure + retry** — a downstream app is unreachable; IGA queues, retries
  with backoff, and raises a task if it keeps failing.
- **Manual approval for privileged birthright** — a sensitive baseline entitlement is
  held for manager/owner approval instead of auto-granted.

## Alternate & related flows

- [mover-role-change](../mover-role-change/README.md) — how access changes after onboarding.
- [leaver-offboarding](../leaver-offboarding/README.md) — the eventual teardown of everything provisioned here.
- [scim-provisioning](../scim-provisioning/README.md) — the wire protocol used to create the accounts.
- [jml-orchestration](../jml-orchestration/README.md) — where this fits in the overall lifecycle.

## Related diagrams

- [MFA enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — the credential/second-factor enrollment the welcome step kicks off.
- [Self-service password reset](../../password-management/self-service-reset/README.md) — how the worker recovers the credential issued here.
- [Identity Provider reference architecture](../../architecture/identity-provider-reference-architecture/README.md) — where HR, IGA, and IdP sit in the platform.

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — message-level onboarding exchange
- [swimlane.md](swimlane.md) — responsibilities per actor lane
- [flowchart.md](flowchart.md) — provisioning decision logic and error paths
