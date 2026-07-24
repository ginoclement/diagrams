# Kerberos Constrained Delegation — S4U2Self and S4U2Proxy

## Purpose

Constrained delegation (Microsoft's **KCD**, extensions `MS-SFU`) replaces the
"hand the service a TGT" model of
[unconstrained delegation](../unconstrained-delegation/README.md) with two
targeted extensions:

- **S4U2Self** — *Service for User to Self*. A service asks the KDC for a service
  ticket **to itself, in the name of a user**, without that user presenting any
  Kerberos credential. This is **protocol transition**: the user may have
  authenticated by forms login, client certificate, or anything else, and the
  service converts that into a Kerberos identity with a full PAC.
- **S4U2Proxy** — *Service for User to Proxy*. The service presents that user
  ticket back to the KDC in the `additional-tickets` field and asks for a ticket
  to a **specific target SPN**. The KDC issues it only if the SPN appears on the
  front-end account's **`msDS-AllowedToDelegateTo`** attribute.

The allowlist lives on the **front-end** account, so a domain admin must approve
each delegation target. (The mirror-image model, where the *resource* decides, is
[RBCD](../resource-based-constrained-delegation/README.md).)

## When it is used

- A web front end authenticating users with forms, SAML, or OIDC that must then
  reach a Kerberos back end — SQL Server, a file share, Exchange — as the user.
- Reverse proxies and API gateways performing Kerberos protocol transition
  (Okta Access Gateway, ForgeRock IG, F5 APM, NetScaler and similar).
- Any multi-tier app where the exact set of back-end SPNs is known and stable.

## Two configurations

| AD setting | `userAccountControl` | Behaviour |
|---|---|---|
| *Use Kerberos only* | `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` **not** set | No protocol transition. The front end must already hold a **forwardable** service ticket the user actually obtained by Kerberos, and uses that as the evidence ticket for S4U2Proxy. S4U2Self still works but returns a **non-forwardable** ticket, usable for identity only. |
| *Use any authentication protocol* | `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` set | Protocol transition allowed. S4U2Self returns a **forwardable** ticket, so the front end can chain straight into S4U2Proxy for any user it names. |

## Actors

| Actor | Role |
|---|---|
| `User` | Human principal being impersonated |
| `Client` | Browser or app; may authenticate by any method, Kerberos or not |
| `Frontend` | Service account holding `msDS-AllowedToDelegateTo` |
| `KDC` | KDC enforcing both S4U checks |
| `Backend` | Target service whose SPN is on the allowlist |

## Key protocol details

- **`PA-FOR-USER`** — padata in the S4U2Self TGS-REQ naming the user to
  impersonate, protected by a checksum keyed with the front end's own key. Only
  an account that knows its own key can ask for tickets in someone else's name.
- **Evidence ticket** — the ticket returned by S4U2Self (or a real user ticket in
  Kerberos-only mode). It must carry the **`forwardable`** flag or S4U2Proxy will
  refuse it.
- **`additional-tickets`** — the TGS-REQ field carrying the evidence ticket in the
  S4U2Proxy request, alongside the front end's own TGT.
- **Allowlist check** — the KDC compares the requested `sname` against
  `msDS-AllowedToDelegateTo` on the front-end account. Classic KCD is confined to
  the front end's own domain.
- **PAC** — copied from the evidence ticket into the issued ticket, so the back
  end sees the user's real groups. The `S4U_DELEGATION_INFO` PAC structure records
  the delegation chain, which is the audit trail for who impersonated whom.
- The issued ticket names the **user** as `cname` but is encrypted with the
  **back-end** account's key, so the back end sees an ordinary user ticket.

## Alternate / error scenarios

- **Target SPN not on `msDS-AllowedToDelegateTo`** — S4U2Proxy fails with
  `KDC_ERR_BADOPTION`. This is the core constraint of the model.
- **Evidence ticket not forwardable** — protocol transition is disabled and the
  service tried to chain from an S4U2Self ticket: `KDC_ERR_BADOPTION`.
- **Protocol transition disabled and no real Kerberos evidence ticket** — the
  front end can establish *identity* via S4U2Self but cannot delegate at all.
- **User is sensitive / in Protected Users** — the KDC refuses to issue an
  S4U ticket for that account, so privileged identities cannot be impersonated.
- **Front end lacks a valid TGT** — S4U requests are TGS exchanges and need the
  front end's own TGT first.
- **Cross-domain target** — classic KCD does not follow referrals for S4U2Proxy;
  the delegation target must normally be in the same domain. Use
  [RBCD](../resource-based-constrained-delegation/README.md) for cross-domain.

## Security notes

- **Protocol transition is impersonation without proof.** A front end configured
  with *Use any authentication protocol* can mint a forwardable ticket for **any**
  non-protected user in the domain. Compromise of that service account therefore
  yields access to every SPN on its allowlist as any user — including
  administrators, unless those accounts are marked sensitive or are in Protected
  Users.
- **The allowlist is per-SPN, not per-host.** `CIFS/server` and `HOST/server`
  differ, but an SPN like `HOST/server` implicitly covers a broad set of services
  on that host, and SPN records can be added to the same account. Grant narrowly.
- **Write access to `msDS-AllowedToDelegateTo`** on a service account is an
  escalation primitive: whoever can edit it chooses new delegation targets. In
  modern AD that write requires `SeEnableDelegationPrivilege`, normally domain
  admin — one reason attackers prefer
  [RBCD](../resource-based-constrained-delegation/README.md), whose attribute is
  writable by whoever controls the resource object.
- Protect impersonation-worthy identities: *Account is sensitive and cannot be
  delegated*, Protected Users, and authentication policy silos.
- Audit `S4U_DELEGATION_INFO` in PACs and event 4769 requests where the requesting
  account differs from the ticket's user to see delegation actually happening.

## Diagrams

- [Sequence diagram](sequence.md) — S4U2Self then S4U2Proxy, with denial alternates
- [Swimlane diagram](swimlane.md) — lanes for User, Client, Frontend, KDC, Backend
- [Flowchart (decision logic)](flowchart.md) — both KDC checks and every error terminal

## Related diagrams

- [Unconstrained Delegation](../unconstrained-delegation/README.md) — the unlimited model this replaces.
- [Resource-Based Constrained Delegation](../resource-based-constrained-delegation/README.md) — same S4U calls, opposite side holds the allowlist.
- [TGS Exchange](../tgs-exchange/README.md) — S4U requests are TGS exchanges with extra padata.
- [AP Exchange](../ap-exchange/README.md) — how the issued ticket is finally used.
- [SPNEGO over HTTP](../spnego-http/README.md) — how a front end gets a real Kerberos evidence ticket.
- [Header-based SSO](../../tokenless/header-based-sso/README.md) — the non-Kerberos way gateways assert identity downstream.
