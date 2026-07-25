# Active Directory Interactive Logon

**Status:** ✅ Current

## What it is

Interactive logon is what happens when a user signs in to a domain-joined Windows machine
with a username and password (or smart card). The Windows logon stack — `Winlogon`,
`LogonUI`/credential providers, the Local Security Authority (`LSASS`) and its Security
Support Providers (SSPs) — turns those credentials into domain authentication and a local
access token that carries the user's group memberships.

For domain accounts, the negotiation SSP (`SPNEGO`) is used: Windows **prefers Kerberos**
and only **falls back to NTLM** when Kerberos is unavailable (no line of sight to a domain
controller for the KDC, access by IP address instead of hostname, a local account, or a
target with no Service Principal Name). Kerberos yields a TGT cached by `LSASS` and is used
for subsequent access to domain services; NTLM is a challenge/response with no ticket.

## When it is used

- Every domain user logging on at a Windows workstation or server console, over RDP, or
  unlocking a session.
- Behind the scenes for network access to domain resources (file shares, SQL, IIS) once the
  interactive logon has cached a TGT — those use Kerberos service tickets via SPNEGO.
- NTLM fallback still occurs for legacy apps, IP-literal connections, workgroup/local
  accounts, and cross-forest cases without the right trust or name resolution.

## Actors

| Actor | Role |
|---|---|
| `User` | Human at the workstation entering credentials |
| `Client` | Windows logon stack: Winlogon, LSASS, Kerberos + NTLM SSPs |
| `KDC` | Domain Controller's Key Distribution Center (Kerberos AS/TGS) |
| `Directory` | Active Directory account database consulted by the DC |

## Key details

- **Negotiate (SPNEGO)** advertises Kerberos and NTLM; the mechanism actually used depends on
  whether a Kerberos ticket can be obtained for the target.
- Kerberos logon runs the **AS exchange** (get a TGT) — see
  [Kerberos AS Exchange](../../kerberos/as-exchange/README.md) — then a **TGS exchange** for
  each service, presenting service tickets via the **AP exchange**.
- The user's group SIDs ride in the Kerberos **PAC**; Windows builds the logon token from it.
- **NTLM** is a three-message handshake: `NEGOTIATE` → `CHALLENGE` (server nonce) →
  `AUTHENTICATE` (response computed from the NT hash). The DC verifies it via **Netlogon**
  (pass-through / secure channel). No ticket, no mutual auth by default.

## Alternate scenarios covered

- **Happy path** — Kerberos AS + TGS + AP, token built from the PAC.
- **NTLM fallback** — no SPN / IP-literal / no KDC reachable → NTLM challenge-response.
- **Cached domain logon** — DC unreachable; Windows validates against cached verifier.
- Wrong password, locked/disabled account, and clock skew breaking Kerberos.

## Security notes

- **🟡 NTLM is Legacy and discouraged.** It is vulnerable to relay attacks, pass-the-hash, and
  offline cracking of captured responses, and lacks channel/mutual authentication. Prefer
  Kerberos; audit and progressively **restrict NTLM** (Group Policy *Network security:
  Restrict NTLM*), require SMB signing and LDAP channel binding to blunt relay.
- Kerberos armoring (**FAST**) protects pre-auth; enforce AES etypes and disable RC4/DES to
  reduce Kerberoasting and AS-REP roasting exposure.
- **Pass-the-hash** targets the NT hash cached in `LSASS`; use Credential Guard, LSA
  protection, and tiered admin to contain it.
- Cached credentials enable offline logon but are a theft target — limit the number cached and
  protect with disk encryption.
- Smart-card / Windows Hello logon replaces the password with certificate-based **PKINIT** —
  see [Kerberos PKINIT](../../kerberos/pkinit/README.md) and
  [Windows Hello for Business](../../cloud-iam/entra/windows-hello-for-business/README.md).

## Related diagrams

- [Kerberos AS Exchange](../../kerberos/as-exchange/README.md) — the TGT-issuing step of the happy path
- [Kerberos TGS Exchange](../../kerberos/tgs-exchange/README.md) — obtaining service tickets after logon
- [SPNEGO over HTTP](../../kerberos/spnego-http/README.md) — the same Negotiate/NTLM-fallback logic for browsers
- [LDAP Bind Authentication](../ldap-bind-authentication/README.md) — non-Windows apps authenticating to the same directory
- [Windows Hello for Business](../../cloud-iam/entra/windows-hello-for-business/README.md) — passwordless replacement for this logon

## Files

- [sequence.md](sequence.md) — logon message exchange with Kerberos and NTLM branches
- [swimlane.md](swimlane.md) — lanes for User, Client, KDC, Directory
- [flowchart.md](flowchart.md) — Kerberos-vs-NTLM decision logic and error terminals
