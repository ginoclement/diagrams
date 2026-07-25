---
title: "Pass-the-Hash / Pass-the-Ticket"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pass-the-Hash / Pass-the-Ticket

**Status:** ✅ Current (active threat; defenses current)

## What it is

Two closely-related **credential-replay** lateral-movement techniques:

- **Pass-the-Hash (PtH)** — with **NTLM**, the *NT hash* of a password is the authenticator;
  the plaintext is never needed. An attacker who dumps a hash from **LSASS** memory, the SAM,
  or NTDS.dit can authenticate to any resource that accepts NTLM **as that user, without ever
  cracking the password**.
- **Pass-the-Ticket (PtT)** — with **Kerberos**, a stolen **TGT** or **service ticket**
  extracted from a host's memory can be injected into the attacker's session and replayed to
  the [AP exchange](../../authentication/kerberos/ap-exchange/README.md) to access services as the victim,
  until the ticket expires.

Both abuse legitimate authentication material rather than a protocol flaw: PtH abuses the
NTLM challenge/response (which proves knowledge of the hash, not the password), and PtT
abuses Kerberos ticket portability. The root enabler is **credential/ticket theft from
memory**, so defenses focus on preventing theft, isolating tiers, and detecting replay.

## When it is used

- **Lateral movement** and **privilege escalation** after compromising one host, especially
  when a privileged account (helpdesk, admin) has logged on there and left credentials or
  tickets in memory.
- To move without knowing any plaintext password, and to reuse cached admin credentials
  across many machines (classic "credential reuse" spread).

## Actors

| Actor | Role |
|---|---|
| Attacker | Steals hashes/tickets from a compromised host and replays them to other systems |
| Victim | The user whose hash or ticket is stolen (often an admin who logged on to the beachhead) |
| IdP | The **KDC** (for PtT) or NTLM-accepting servers (for PtH) that accept the replayed material |
| Directory | Active Directory holding accounts, group membership, and tiering |
| Defender controls | Credential Guard, LSASS protection, admin tiering, LAPS, network segmentation, 4624/4776 monitoring |

## Alternate scenarios covered

- **Credential Guard / LSASS protection (theft prevented):** VBS-isolated secrets and
  PPL-protected LSASS mean the hash/ticket cannot be read from memory in the first place.
- **Admin tiering + no cached privileged creds (blast radius limited):** Tier-0 admins never
  log on to Tier-1/2 hosts, so a workstation compromise yields no reusable admin material.
- **Detection of replay:** NTLM auth (event 4776/4624 type 3) from an unexpected host, or a
  ticket used from a source that never obtained it, or lateral bursts to many hosts.

## Security notes

There is no single "block" for replay — if the attacker holds valid credential material and
the target accepts it, it authenticates. Defense is layered: **prevent theft** (Credential
Guard, LSASS PPL), **contain reuse** (tiering, unique local passwords, phishing-resistant
auth), and **detect movement** (logon anomalies).

### Detection

- **NTLM anomalies:** event **4776** (NTLM validation) and **4624 logon type 3** from hosts or
  accounts that don't normally use NTLM, or NTLM where Kerberos is expected. A privileged
  account authenticating via NTLM to many hosts is a strong lateral-movement signal.
- **Pass-the-Ticket:** tickets appearing on a host that never performed the AS/TGS exchange
  to obtain them; anomalous ticket lifetimes/encryption types; a user's ticket used from a
  source IP that never logged that user on.
- **Behavioral:** rapid authentication to many systems, admin logons on unusual endpoints,
  and use of remote-exec service accounts. Feed 4624/4625/4768/4769/4776 into the SIEM/UEBA.

### Mitigation

- **Windows Defender Credential Guard** (VBS) to isolate NTLM hashes and Kerberos TGTs from
  LSASS, and run **LSASS as a protected process (PPL)** — this removes the theft primitive.
- **Tiered administration** (Tier 0/1/2): privileged accounts never authenticate to
  lower-tier hosts; use jump/PAW workstations for admin tasks.
- **Unique local admin passwords (LAPS)** so a dumped local hash can't unlock other machines;
  disable/limit NTLM and move to Kerberos and **phishing-resistant** auth.
- **Network segmentation** and host firewalls to constrain lateral RPC/SMB/WinRM paths — see
  [Network segmentation / DMZ](../../infrastructure/network-security/network-segmentation-dmz/README.md).
- **Reduce credential exposure:** avoid interactive logon of service/admin accounts, enable
  "Restricted Admin"/remote credential guard for RDP, and expire/rotate on compromise.

## Related diagrams

- [Kerberos AP Exchange](../../authentication/kerberos/ap-exchange/README.md) — the service-ticket presentation a stolen ticket is replayed into.
- [Kerberos TGS Exchange](../../authentication/kerberos/tgs-exchange/README.md) — where a stolen TGT is redeemed for new service tickets.
- [Golden & Silver Ticket](../golden-silver-ticket/README.md) — forging tickets rather than stealing existing ones.
- [Kerberoasting](../kerberoasting/README.md) — another route to service-account credentials.
- [Network segmentation / DMZ](../../infrastructure/network-security/network-segmentation-dmz/README.md) — constraining lateral paths.

## Files

- [sequence.md](./sequence.md) — PtH then PtT replay, with Credential Guard / tiering / detection in `alt`/`opt` blocks.
- [swimlane.md](./swimlane.md) — Attacker / Victim / KDC-and-servers / Defender-controls lanes.
- [flowchart.md](./flowchart.md) — where theft prevention, tiering, and replay detection force deny/detect terminals.
