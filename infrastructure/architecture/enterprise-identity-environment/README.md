---
title: "Enterprise Identity Environment"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Enterprise Identity Environment

**Status:** ✅ Current

A high-level, product-oriented picture of a representative enterprise identity environment —
the systems in it and how they connect. It exists in two views:

- [`flowchart.md`](flowchart.md) — **systems architecture**: named systems (SailPoint, Okta,
  Microsoft Entra ID, Active Directory, Workday, CyberArk, applications, users) with links
  labelled by **function** (provisioning, SSO, sync, certification).
- [`network-security.md`](network-security.md) — the **same environment as network zones**
  separated by firewalls, with every link labelled by **port and protocol**, plus a port
  reference table.

Product names are **illustrative** and meant to be swapped for whatever fills each role in your
estate. The value is the shape: an HR system of record feeding an IGA control plane that
provisions a directory, an IdP, and applications, while the IdP handles run-time authentication
and SSO, and a PAM tool brokers privileged access.

## Systems / roles

| Role | Example product | Responsibility |
|---|---|---|
| HR system of record | Workday | Authoritative worker data; triggers joiner/mover/leaver |
| Identity governance (IGA) | SailPoint | Provisioning, access requests, certifications, SoD |
| Access management (IdP) | Okta, Microsoft Entra ID | Authentication, MFA, SSO to applications |
| Directory | Active Directory | On-prem accounts, groups, Kerberos/LDAP |
| Privileged access (PAM) | CyberArk | Vaulted credentials, brokered privileged sessions |
| Applications | SaaS + on-prem | Relying parties consuming SSO and provisioned access |
| Users / endpoints | — | Workforce and their managed devices |

## When it is used

- Onboarding a new team to how identity works end-to-end in the estate.
- Planning an integration, migration, or segmentation change and needing a shared reference.
- A starting template to fork per environment (prod, a specific business unit, an acquisition).

## Related diagrams

- Conceptual counterpart: [IdP reference architecture](../identity-provider-reference-architecture/README.md)
- [Federation topology](../federation-topology/README.md) · [Zero-trust architecture](../zero-trust-architecture/README.md)
- Lifecycle detail: [JML orchestration](../../../identity-lifecycle/user-lifecycle/jml-orchestration/README.md), [SCIM provisioning](../../../identity-lifecycle/user-lifecycle/scim-provisioning/README.md)
- Network detail: [Network segmentation and DMZ](../../network-security/network-segmentation-dmz/README.md)

## Files

- [`flowchart.md`](flowchart.md) — systems architecture (functional links)
- [`network-security.md`](network-security.md) — network zones with ports and protocols
