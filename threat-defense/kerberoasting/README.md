# Kerberoasting

**Status:** ✅ Current (active threat; defenses current)

## What it is

**Kerberoasting** abuses a normal feature of the Kerberos
[TGS exchange](../../kerberos/tgs-exchange/README.md): any authenticated domain user can
request a **service ticket (TGS-REP)** for any account that has a **Service Principal Name
(SPN)** registered. Part of that ticket is encrypted with a key **derived from the service
account's password**. The attacker requests the ticket, extracts the encrypted portion, and
**cracks the password offline** — with no further traffic to the KDC and no failed-logon
noise. Accounts with weak, human-chosen passwords and legacy **RC4** encryption fall quickly.

It abuses the legitimate flow directly: requesting a TGS for a service is exactly what a
client does before contacting that service. What makes it an attack is requesting tickets
en masse for SPN accounts with no intent to use the service, then attacking the ciphertext.

## When it is used

- **Credential access / privilege escalation** after gaining any low-privileged domain
  foothold. A single valid TGT is enough to roast every SPN in the domain.
- Especially effective against **over-privileged service accounts** (SQL, IIS app pools,
  legacy apps) that are members of high-privilege groups and have stale passwords.

## Actors

| Actor | Role |
|---|---|
| Attacker | Authenticated (low-priv) domain user requesting service tickets and cracking them offline |
| Victim | The **service account** whose SPN is targeted and whose password is cracked |
| IdP | The **KDC / TGS** issuing service tickets (behaves exactly as designed) |
| Directory | Active Directory holding SPNs, account `msDS-SupportedEncryptionTypes`, and group membership |
| Defender controls | 4769 monitoring, gMSA, AES enforcement, SPN hygiene, honeytokens |

## Alternate scenarios covered

- **gMSA / managed service account (attack neutralized):** the password is a 120+ char,
  randomly generated, auto-rotated secret — offline cracking is computationally infeasible.
- **AES-only enforcement:** removing RC4 forces AES tickets, dramatically slowing cracking
  and changing the ticket etype (a detection signal).
- **Detection via event 4769:** a burst of TGS requests, especially for **RC4** tickets or
  many distinct SPNs from one account in a short window, or requests for a **honeypot SPN**.

## Security notes

Kerberoasting cannot be "blocked" at the protocol level — issuing service tickets is the
KDC's job. Defense is about making the **cracked material worthless** (strong/managed
passwords, AES) and **detecting the request pattern** (4769 anomalies, honeytokens).

### Detection

- **Windows event 4769** (Kerberos service-ticket request) is the primary signal. Alert on:
  - a single account requesting tickets for **many distinct SPNs** in a short window,
  - **RC4 (`0x17`) ticket-encryption-type** requests when your environment is AES-capable,
  - requests originating from unusual hosts or off-hours.
- **Honeypot / honeytoken SPN accounts:** create a service account with a tempting name, a
  registered SPN, and **no legitimate use**. *Any* 4769 for it is high-fidelity malicious.
- Correlate roasting bursts with subsequent authentications using a **newly-cracked** account.

### Mitigation

- **Use group Managed Service Accounts (gMSA/dMSA)** or 25+ character random passwords for
  all SPN accounts. Long random secrets make offline cracking infeasible — the top control.
- **Enforce AES** and **remove RC4** (`msDS-SupportedEncryptionTypes`) for service accounts;
  RC4 makes cracking far cheaper.
- **SPN hygiene / least privilege:** remove unnecessary SPNs; never place service accounts in
  Domain Admins or other Tier-0 groups; scope their rights tightly.
- **Rotate service-account passwords** regularly (gMSA does this automatically every ~30 days).

## Related diagrams

- [Kerberos TGS Exchange](../../kerberos/tgs-exchange/README.md) — the legitimate service-ticket request this abuses.
- [Kerberos AS Exchange](../../kerberos/as-exchange/README.md) — where AS-REP roasting (a sibling attack) lives; the TGT used here is issued there.
- [Golden & Silver Ticket](../golden-silver-ticket/README.md) — forging tickets outright once keys are known.
- [Pass-the-Hash / Pass-the-Ticket](../pass-the-hash-ticket/README.md) — reusing the credentials a roast may recover.

## Files

- [sequence.md](sequence.md) — the roast, then gMSA/AES/4769 defenses in `alt`/`opt` blocks.
- [swimlane.md](swimlane.md) — Attacker / Victim / KDC / Defender-controls lanes.
- [flowchart.md](flowchart.md) — where password strength, etype, and monitoring force detect/deny terminals.
