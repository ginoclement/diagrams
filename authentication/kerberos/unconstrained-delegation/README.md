---
title: "Kerberos Unconstrained Delegation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
---

# Kerberos Unconstrained Delegation

**Status:** ⛔ Deprecated

## Purpose

Unconstrained delegation is the original Kerberos delegation model. A service
account or computer flagged **`TRUSTED_FOR_DELEGATION`** (in AD: *Trust this
computer for delegation to any service — Kerberos only*) receives a **copy of the
user's Ticket-Granting Ticket** inside the client's AP-REQ. Holding a forwarded
TGT, the service can request service tickets for **any** SPN in the realm as that
user, for the lifetime of the TGT.

Two things make it work:

1. The KDC sets the **`ok-as-delegate`** flag in the service ticket, telling the
   client that this service is trusted for delegation.
2. The client asks the KDC for a **forwarded TGT** (a TGT with the `forwarded`
   flag, derived from its own `forwardable` TGT) and ships it to the service in a
   **KRB-CRED** structure carried in the authenticator's GSS-API delegation field.

The delegated TGT lands in the service host's LSA credential cache — which is why
this model is the highest-risk one and why Microsoft has replaced it with
[constrained delegation](../constrained-delegation/README.md) and
[RBCD](../resource-based-constrained-delegation/README.md).

## When it is used

- Legacy multi-tier applications: a web front end that must reach a file share,
  SQL Server, or another back end **as the calling user**, where the back-end SPN
  set is not known in advance.
- IIS sites with *Windows Authentication* and delegation enabled to arbitrary
  back ends.
- Historically on domain controllers (which are trusted for delegation by
  default) and on some legacy appliances.

New deployments should not use it. It exists in this repo mainly so its attack
paths are legible.

## Actors

| Actor | Role |
|---|---|
| `User` | Human principal whose identity is delegated |
| `Client` | Workstation / browser stack building the AP-REQ, e.g. SSPI or GSS-API |
| `KDC` | Key Distribution Center, AS and TGS roles |
| `Frontend` | Front-end service flagged `TRUSTED_FOR_DELEGATION` |
| `Backend` | Any downstream service the front end chooses to reach |

## Key protocol details

- **`forwardable`** — flag on the user's original TGT; without it no forwarded TGT
  can be derived.
- **`ok-as-delegate`** — flag the KDC sets in the *service ticket* when the target
  account is `TRUSTED_FOR_DELEGATION`. Clients use it as the signal that
  delegation is permitted; Windows also gates on the *Allow delegating fresh
  credentials* policy.
- **`forwarded`** — flag on the TGT the client obtains for the service.
- **KRB-CRED** — the message that carries the forwarded TGT plus its session key,
  encrypted with the subsession key from the AP-REQ authenticator, so only the
  target service can read it.
- **PAC** — the forwarded TGT still carries the user's PAC, so downstream services
  see the user's real group membership; there is no marker distinguishing a
  delegated call from a direct one.
- Service tickets are encrypted with the **service account's long-term key**, so
  a service can only read tickets addressed to itself — but a *TGT* is unlimited.

## Alternate / error scenarios

- **Front end not trusted for delegation** — no `ok-as-delegate` in the service
  ticket, the client sends no KRB-CRED, and the front end can only act as itself
  (calls to the back end fail or fall back to the service account identity).
- **Account is sensitive and cannot be delegated** — the `NOT_DELEGATED` flag on
  the user account. The KDC refuses to issue a forwardable/forwarded TGT for that
  user (`KDC_ERR_BADOPTION` for the forwarded request), so delegation stops.
- **Protected Users group** — members get no forwardable TGT at all, plus no
  NTLM, no RC4, no DES, and short ticket lifetimes.
- **Client policy blocks credential delegation** — Group Policy *Allow delegating
  fresh/default credentials* not granted for the target SPN.
- **Forwarded TGT expired** — the harvested TGT is only usable until its `endtime`
  (or renewable lifetime), after which the back-end request fails.

## Security notes

- **TGT harvesting**: every user who touches an unconstrained-delegation host
  leaves a usable TGT in that host's LSA cache. Compromising one such server is
  equivalent to compromising every account that has authenticated to it —
  including domain admins.
- **Coercion**: the *printer bug* (`MS-RPRN` `RpcRemoteFindFirstPrinterChangeNotification`)
  and PetitPotam-style `MS-EFSRPC` coercion force a chosen machine — often a
  **domain controller** — to authenticate to an attacker-controlled host. If that
  host has unconstrained delegation, the attacker captures the DC's TGT and can
  DCSync or forge a golden ticket. This is the classic full-domain compromise path.
- Domain controllers are trusted for delegation by default; **any** additional
  account with `TRUSTED_FOR_DELEGATION` should be treated as tier-0.
- Mitigations: remove the flag and migrate to
  [constrained delegation](../constrained-delegation/README.md) or
  [RBCD](../resource-based-constrained-delegation/README.md); put privileged
  accounts in **Protected Users**; set **Account is sensitive and cannot be
  delegated** on tier-0 identities; block the coercion RPC interfaces; alert on
  changes to `userAccountControl` bit `TRUSTED_FOR_DELEGATION` and on
  ticket-forwarding events.
- Detection: LDAP query for `userAccountControl:1.2.840.113556.1.4.803:=524288`,
  and Windows event 4769 for TGT requests with the `forwarded` option from
  unexpected hosts.

## Diagrams

- [Sequence diagram](./sequence.md) — forwarded TGT in KRB-CRED, then impersonated back-end call
- [Swimlane diagram](./swimlane.md) — lanes for User, Client, KDC, Frontend, Backend
- [Flowchart (decision logic)](./flowchart.md) — every gate that must open for delegation to occur

## Related diagrams

- [AS Exchange](../as-exchange/README.md) — where the forwardable TGT is minted.
- [TGS Exchange](../tgs-exchange/README.md) — each ticket request shown here.
- [AP Exchange](../ap-exchange/README.md) — the AP-REQ that carries the KRB-CRED.
- [Constrained Delegation](../constrained-delegation/README.md) — the S4U replacement, limited to an SPN allowlist.
- [Resource-Based Constrained Delegation](../resource-based-constrained-delegation/README.md) — control moved to the resource.
- [Cross-Realm](../cross-realm/README.md) — delegation risk when the caller comes from another realm.
- [Zero-trust architecture](../../../infrastructure/architecture/zero-trust-architecture/README.md) — why ambient impersonation is discouraged.

## Why deprecated

Unconstrained delegation lets a service impersonate a user to **any** other service,
caching a forwardable TGT on the service host. If that host is compromised, every
delegated user's TGT can be extracted and replayed — a well-known lateral-movement and
privilege-escalation path.

## Use instead

- [Resource-based constrained delegation](../resource-based-constrained-delegation/README.md) (preferred)
- [Constrained delegation (S4U2Proxy)](../constrained-delegation/README.md)
