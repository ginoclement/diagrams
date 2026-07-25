# Golden & Silver Ticket

**Status:** ✅ Current (active threat; defenses current)

## What it is

Two related Kerberos **forgery** attacks that abuse the fact that a ticket is trusted by
whoever can decrypt it, and the KDC does not re-verify a well-formed ticket's origin:

- **Golden Ticket** — the attacker forges a **Ticket-Granting Ticket (TGT)** using the stolen
  **krbtgt account key**. Because every TGT is encrypted with the krbtgt key, a forged TGT is
  accepted by the [TGS](../../kerberos/tgs-exchange/README.md) as genuine, for any user
  (including a non-existent one), with any group membership in its PAC. It is domain-wide,
  long-lived persistence.
- **Silver Ticket** — the attacker forges a **service ticket (TGS)** using a single
  **service account's key** (or a computer account key). It is accepted directly by that one
  service at the [AP exchange](../../kerberos/ap-exchange/README.md) — **the KDC is never
  contacted**, so KDC-side logging never sees it. Scope is one service, but it is stealthier.

Both abuse the legitimate [AS](../../kerberos/as-exchange/README.md) and
[AP](../../kerberos/ap-exchange/README.md) exchanges by injecting forged, correctly-encrypted
tickets instead of legitimately-issued ones.

## When it is used

- **Persistence and privilege escalation after Tier-0 compromise.** A Golden Ticket requires
  the krbtgt key (e.g. from a DC via DCSync/DCsync-style replication or NTDS.dit theft); a
  Silver Ticket requires only one service/computer account key.
- To survive user password resets (the forgeable secret is the krbtgt/service key, not the
  user's password) and to move without generating normal authentication traffic.

## Actors

| Actor | Role |
|---|---|
| Attacker | Holds a stolen krbtgt key (Golden) or service key (Silver); forges tickets |
| Victim | The user/identity impersonated, and the service ultimately accessed |
| IdP | The **KDC** (AS + TGS). Contacted for Golden (TGS accepts the forged TGT); **bypassed** for Silver |
| Directory | Active Directory / DC holding the krbtgt and service account keys |
| Defender controls | krbtgt rotation, PAC validation, event 4769/4624 monitoring, Tier-0 protection |

## Alternate scenarios covered

- **krbtgt rotated twice (Golden invalidated):** the forged TGT was signed with the old key;
  after two rotations it no longer decrypts/verifies, killing existing golden tickets.
- **PAC validation / signature checks:** services and KDCs validating PAC signatures (and
  newer PAC hardening) reject tickets whose PAC was tampered or whose signatures don't chain.
- **Silver-ticket detection:** authentications to a service with **no preceding TGS-REQ
  (event 4769) at the KDC** reveal a forged service ticket.

## Security notes

Like [Golden SAML](../golden-saml/README.md), this is a **key-custody** problem: whoever holds
the krbtgt or a service key can mint tickets that are cryptographically valid. Defense is
**protect Tier-0 keys**, **rotate to invalidate forgeries**, and **validate the PAC** so
forged privilege claims don't chain.

### Detection

- **Golden Ticket:** TGTs with anomalous lifetimes (default forged lifetime often very long),
  RC4 where AES is expected, mismatched or missing account details, or a username in tickets
  that doesn't exist in AD. Correlate TGS activity that lacks a preceding AS-REP.
- **Silver Ticket:** service access (event 4624 logon on the target host) with **no matching
  KDC event 4769** — because the KDC was never asked. This KDC/host log mismatch is the key
  signal. Also watch for PAC validation failures.
- Monitor DCs for **krbtgt key access** and replication (DCSync-style) behavior — the theft
  step that precedes Golden.

### Mitigation

- **Rotate the krbtgt password twice** (with a delay to allow ticket lifetime to lapse
  between rotations) on a schedule and immediately after any DC/Tier-0 compromise — this is
  the definitive way to invalidate golden tickets.
- **Enforce PAC signature validation** and keep systems patched for PAC-hardening updates so
  forged/tampered PACs are rejected.
- **Protect Tier-0** (DCs, krbtgt, service keys): tiered admin model, no reuse of DA
  credentials on workstations, LSASS/credential protection, restrict who can replicate the
  directory.
- **AES everywhere** and **least-privilege service accounts** shrink both the attack surface
  and the value of a stolen key.

## Related diagrams

- [Kerberos AS Exchange](../../kerberos/as-exchange/README.md) — legitimate TGT issuance the Golden Ticket forges.
- [Kerberos AP Exchange](../../kerberos/ap-exchange/README.md) — legitimate service-ticket presentation the Silver Ticket forges.
- [Kerberos TGS Exchange](../../kerberos/tgs-exchange/README.md) — where a forged TGT is redeemed for service tickets.
- [Kerberoasting](../kerberoasting/README.md) — how a service key/password might be obtained in the first place.
- [Pass-the-Hash / Pass-the-Ticket](../pass-the-hash-ticket/README.md) — reusing stolen keys/tickets more directly.

## Files

- [sequence.md](sequence.md) — Golden then Silver forgery, with rotation/PAC defenses in `alt`/`opt` blocks.
- [swimlane.md](swimlane.md) — Attacker / Victim / KDC / Defender-controls lanes.
- [flowchart.md](flowchart.md) — where rotation, PAC validation, and log correlation force deny/detect terminals.
