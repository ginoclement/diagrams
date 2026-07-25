---
title: "Kerberos Cross-Realm Authentication"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Kerberos Cross-Realm Authentication

**Status:** ✅ Current

## Purpose

Cross-realm (cross-domain) authentication lets a principal that authenticated in
**Realm A** obtain a service ticket for a service in **Realm B**. Kerberos never
sends the user's key to the remote realm; instead each pair of trusting realms
shares an **inter-realm key** stored as a special principal:

- `krbtgt/B@A` — the inter-realm TGT issued by Realm A for use at Realm B.
- `krbtgt/A@B` — the reverse direction (two-way trusts hold both).

The client's home KDC cannot issue a ticket for a foreign SPN, so it answers the
TGS-REQ with a **referral**: an inter-realm TGT pointing at the next realm on
the trust path. The client walks that path one hop at a time until it reaches
the KDC that owns the service, which then issues the real service ticket.

In Active Directory, trusts inside a forest are **transitive**, so a request from
`CHILD1.CORP.EXAMPLE.COM` to `CHILD2.CORP.EXAMPLE.COM` is normally referred up to
the **forest root** and back down, producing more than one referral hop.

## When it is used

- A user in one AD domain opening a file share, SQL Server, or intranet site in
  another domain of the same forest (transitive intra-forest referral).
- Access across a forest trust or an external trust between organisations.
- MIT / Heimdal realms trusting an AD realm (or each other) for UNIX services.
- Any SPN whose realm differs from the realm in the client's current TGT.

## Actors

| Actor | Role |
|---|---|
| `User` | Human principal, home realm `REALM-A` |
| `Client` | Kerberos client / OS credential cache holding the TGTs |
| `KDC-A` | KDC of the client's home realm `REALM-A` |
| `KDC-Root` | KDC of the intermediate realm on the trust path, e.g. the forest root |
| `KDC-B` | KDC of `REALM-B`, which owns the target service principal |
| `Service` | Target application service in `REALM-B` |

## Key protocol details

- **Referral**: when the requested `sname` is unknown locally but its realm is
  reachable, the KDC returns a TGS-REP whose ticket is `krbtgt/NEXT-REALM@THIS-REALM`,
  encrypted with the **inter-realm trust key**, not the local krbtgt key. The reply
  ticket carries the `forwardable`, `renewable` and `ok-as-delegate` flags the
  policy allows.
- **Transited field**: each hop appends its realm to the ticket's `transited`
  encoding. The final KDC (and optionally the service) validates that the transit
  path is acceptable, setting `transited-policy-checked`.
- **PAC and SID filtering**: the PAC travels with the referral. The KDC on the
  trusting side re-signs it and applies **SID filtering** — for external and
  forest trusts it discards SIDs from domains outside the trusted forest, which
  is what stops SID-history injection from a compromised trusted domain.
- **Service ticket**: only `KDC-B` can issue it, because only `KDC-B` knows the
  long-term key of the service account that the ticket is encrypted with.
- **Selective authentication** (AD forest/external trusts) requires the incoming
  principal to hold the *Allowed to authenticate* right on the target computer
  object; without it `KDC-B` refuses even though the trust path is valid.

## Alternate / error scenarios

- **No trust path** — the realms are not connected, or the transit path is not
  acceptable to the target KDC: `KDC_ERR_PATH_NOT_ACCEPTED`. Common with
  disabled transitivity, a broken trust password, or a realm not listed in
  `capaths` on MIT clients.
- **Unknown service principal in the remote realm** —
  `KDC_ERR_S_PRINCIPAL_UNKNOWN` from `KDC-B` (missing or duplicate SPN).
- **Selective authentication denied** — `KDC_ERR_POLICY` /
  `STATUS_AUTHENTICATION_FIREWALL_FAILED` because the principal lacks
  *Allowed to authenticate* on the resource.
- **Trust key mismatch** — the inter-realm key was rotated on one side only:
  the next-hop KDC cannot decrypt the referral TGT
  (`KRB_AP_ERR_MODIFIED`).
- **Clock skew across realms** — `KRB_AP_ERR_SKEW`; independent NTP sources in
  the two realms drift apart.
- **Etype mismatch** — the trust was created with RC4 only while one side
  enforces AES: `KDC_ERR_ETYPE_NOSUPP`.

## Security notes

- Treat a trust as an **authentication boundary, not a security boundary**: a
  compromised trusted realm can mint tickets for its own principals at will.
  Use **selective authentication** so incoming principals must be explicitly
  granted access, rather than forest-wide implicit access.
- **SID filtering** must stay enabled on external/forest trusts. Disabling it
  (`netdom trust /enablesidhistory:yes` on an untrusted partner) allows a
  compromised trusted domain to inject the target forest's Enterprise Admins SID
  through SID history and escalate across the trust.
- The **trust key is a golden-ticket-class secret**: whoever holds `krbtgt/B@A`
  can forge inter-realm TGTs from A into B. Rotate trust passwords like krbtgt
  keys and monitor for their extraction.
- Prefer AES etypes on trusts; RC4 trust keys are crackable offline from a
  captured inter-realm TGT.
- Delegation composes with trusts: a service reached cross-realm can still be
  configured for [unconstrained delegation](../unconstrained-delegation/README.md),
  which would expose the visiting user's forwarded TGT to the foreign realm.

## Diagrams

- [Sequence diagram](sequence.md) — referral chain with a forest-root hop, plus error alternates
- [Swimlane diagram](swimlane.md) — lanes for Client, KDC-A, KDC-Root, KDC-B, Service
- [Flowchart (decision logic)](flowchart.md) — referral loop and every deny terminal

## Related diagrams

- [AS Exchange](../as-exchange/README.md) — how the initial home-realm TGT is obtained.
- [TGS Exchange](../tgs-exchange/README.md) — the single-realm version of each hop here.
- [AP Exchange](../ap-exchange/README.md) — presenting the final service ticket.
- [Constrained Delegation](../constrained-delegation/README.md) — note that S4U2Proxy is
  generally not supported across realms; RBCD is the cross-domain-capable model.
- [Resource-Based Constrained Delegation](../resource-based-constrained-delegation/README.md)
- [Federation topology](../../architecture/federation-topology/README.md) — trust topologies
  expressed at the architecture level.
