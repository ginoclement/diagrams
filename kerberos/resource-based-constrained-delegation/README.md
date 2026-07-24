# Resource-Based Constrained Delegation (RBCD)

## Purpose

RBCD inverts the direction of the delegation allowlist. In classic
[constrained delegation](../constrained-delegation/README.md) the **front end**
carries `msDS-AllowedToDelegateTo`, which only a domain admin may edit. In RBCD
the **resource** — the back-end computer or service account — carries
**`msDS-AllowedToActOnBehalfOfOtherIdentity`**, a security descriptor naming the
principals that are permitted to impersonate users *to it*.

The wire protocol is the same pair of `MS-SFU` extensions:

- **S4U2Self** — the front end obtains a ticket to itself in the user's name.
- **S4U2Proxy** — the front end asks for a ticket to the back-end SPN, presenting
  that ticket as evidence.

Only the KDC's authorization check changes: instead of reading the front end's
allowlist, the KDC reads the **resource's** security descriptor and asks whether
the requesting principal is granted access in it. Because that check is performed
by the KDC of the *resource's* domain, RBCD also works **across domains** in a
forest, which classic KCD does not.

## When it is used

- Delegation configured by the team that owns the back-end service rather than by
  a domain admin — the intended design goal, since the resource owner is the party
  that actually bears the risk.
- Multi-tier apps spanning domains inside a forest.
- Modern replacements for unconstrained delegation, together with
  Windows Server 2012+ front ends.
- Offensively: the most common Active Directory lateral-movement and privilege
  escalation primitive whenever an attacker holds write access to a computer object.

## Actors

| Actor | Role |
|---|---|
| `User` | Human principal being impersonated |
| `Client` | Browser or app; may authenticate by any method |
| `Frontend` | Delegating principal, must have an SPN; named in the resource's descriptor |
| `KDC` | KDC of the resource's domain, which evaluates the descriptor |
| `Backend` | The **resource**, holding `msDS-AllowedToActOnBehalfOfOtherIdentity` |

## Key protocol details

- **`msDS-AllowedToActOnBehalfOfOtherIdentity`** — stored on the back-end object
  as a `SECURITY_DESCRIPTOR` (in PowerShell it is set from an SDDL string). Its
  DACL lists the SIDs allowed to delegate to this resource.
- **Evidence ticket forwardability** — with RBCD the KDC does **not** require the
  evidence ticket from S4U2Self to be forwardable. A front end that lacks
  `TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION` can still complete S4U2Proxy, and the
  ticket the KDC issues **is** forwardable. This relaxation is what makes RBCD so
  easy to abuse with an attacker-created computer account.
- **SPN requirement** — the delegating principal must have at least one SPN.
  Attackers satisfy this by creating a computer account, which gets SPNs
  automatically (`MachineAccountQuota`, default 10 per user).
- **PAC** — copied from the evidence ticket, with the delegation chain recorded in
  `S4U_DELEGATION_INFO`; the ticket is encrypted with the back-end account key and
  names the user as `cname`.
- **Precedence** — if both attributes are configured, the resource-based check is
  evaluated by the resource's KDC and is the one that governs cross-domain flows.

## Alternate / error scenarios

- **Front end not in the resource's allow list** — S4U2Proxy fails with
  `KDC_ERR_BADOPTION`. The KDC gives no hint about which principals are allowed.
- **Front end has no SPN** — the KDC will not treat it as a delegating service;
  S4U2Proxy fails.
- **User is sensitive / in Protected Users** — the KDC refuses to issue a
  delegated ticket naming that user, exactly as in classic KCD.
- **Attribute written but replication lag** — the resource's KDC has not yet seen
  the descriptor; the request fails until the change replicates.
- **Malformed security descriptor** — an unparsable value behaves as "nobody
  allowed"; delegation silently fails.
- **Back-end key rotated** — the issued ticket cannot be decrypted:
  `KRB_AP_ERR_MODIFIED`.

## Security notes

- **The RBCD attack path** is the headline risk. Whoever can write
  `msDS-AllowedToActOnBehalfOfOtherIdentity` on a computer object can take that
  computer over:
  1. Attacker holds `GenericWrite`, `GenericAll`, `WriteDacl`, `WriteProperty`, or
     `WriteAccountRestrictions` over the target computer object — often through a
     nested group, an over-broad delegation of OU rights, or a coerced NTLM relay
     to LDAP.
  2. Attacker creates a computer account they control, using the default
     `MachineAccountQuota` of 10, which conveniently has SPNs.
  3. Attacker sets the target's descriptor to allow that new account.
  4. S4U2Self + S4U2Proxy produce a ticket for `cifs/target` (or `HOST/target`) as
     **Domain Admin**, because RBCD does not require a forwardable evidence ticket.
  5. That ticket grants local administrator access to the target host.
- Mitigations: set `MachineAccountQuota` to **0** and provision computer accounts
  deliberately; audit and tighten ACLs on computer objects and OUs; put privileged
  accounts in **Protected Users** and mark them *sensitive and cannot be delegated*
  so step 4 cannot name them; enforce LDAP signing and channel binding to stop
  relay-to-LDAP; alert on any write to
  `msDS-AllowedToActOnBehalfOfOtherIdentity` and on computer-account creation.
- The upside is real: RBCD lets the **resource owner** grant delegation without
  domain-admin involvement, and revocation is a single attribute edit on the
  object that bears the risk. The same property is what makes write access to that
  object equivalent to owning it.

## Diagrams

- [Sequence diagram](sequence.md) — S4U2Self, S4U2Proxy and the resource-side check
- [Swimlane diagram](swimlane.md) — lanes for User, Client, Frontend, KDC, Backend
- [Flowchart (decision logic)](flowchart.md) — KDC decisions plus the abuse path

## Related diagrams

- [Constrained Delegation](../constrained-delegation/README.md) — same S4U calls, allowlist on the front end.
- [Unconstrained Delegation](../unconstrained-delegation/README.md) — the unscoped model both replace.
- [TGS Exchange](../tgs-exchange/README.md) — the exchange underlying both S4U calls.
- [AP Exchange](../ap-exchange/README.md) — using the issued ticket at the resource.
- [Cross-Realm](../cross-realm/README.md) — why RBCD, not KCD, is the cross-domain option.
- [Zero-trust architecture](../../architecture/zero-trust-architecture/README.md) — resource-owned authorization as a design principle.
