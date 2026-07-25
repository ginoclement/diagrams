# Pass-Through Authentication (PTA)

**Status:** ✅ Current

## What it is

Pass-Through Authentication lets a cloud identity service (Entra ID / Microsoft 365)
validate a user's password directly against on-premises Active Directory **in real time**,
without ever storing a password hash in the cloud. A lightweight on-prem **PTA agent**
holds an asymmetric key pair; the cloud encrypts the submitted password with the agent's
public key and hands it to the agent over a persistent outbound channel. The agent
decrypts it and validates it against a domain controller using the Win32 `LogonUser`
call, then returns only a pass/fail (with a specific sub-status). The cloud issues the
token or session based on that answer.

Unlike [Password Hash Sync](../password-hash-sync/README.md), no hash — not even a
salted derivative — leaves the corporate boundary. On-prem account state (password
expiry, lockout, disabled, logon-hours) is enforced at authentication time because the
DC is consulted live.

## When it is used

- Organizations that require passwords to be verified on-prem for compliance or policy
  reasons, but still want cloud-native sign-in for Microsoft 365 and SaaS apps.
- As a **managed (cloud) authentication** option that avoids the operational weight of
  [federation](../federated-vs-managed-auth/README.md) (ADFS) while keeping validation
  on-prem.
- Usually paired with **Seamless SSO** (Kerberos) so domain-joined machines sign in
  without a prompt, and with cloud **smart lockout** to blunt password spray.

## Actors

| Actor | Role |
|---|---|
| `User` | Human entering UPN + password at the cloud sign-in page |
| `Browser` | User agent posting credentials to the cloud endpoint |
| `Cloud` | Cloud auth service (Entra ID); encrypts the password, issues the token |
| `Agent` | On-prem PTA authentication agent; decrypts and validates against AD |
| `Directory` | Active Directory domain controller that verifies the password |

## Key details

- The PTA agent registers an **RSA key pair** with the cloud; the private key never
  leaves the agent. The cloud queues each password encrypted with the agent's public key.
- The agent maintains **outbound-only** persistent connections (443) to the cloud and
  polls a Service Bus queue — **no inbound firewall ports** are opened.
- Validation uses `LogonUser` (a Kerberos AS exchange against the DC under the hood), so
  the DC returns granular results: success, wrong password, `PASSWORD_EXPIRED`,
  `MUST_CHANGE`, `ACCOUNT_LOCKED`, `ACCOUNT_DISABLED`, outside logon hours.
- Deploy **2–3 agents** for high availability; if no agent can service the request the
  sign-in fails (there is no cloud-side fallback unless PHS is also enabled as backup).

## Alternate scenarios covered

- **Happy path** — cloud encrypts, agent decrypts and validates, DC confirms, token issued.
- **Wrong password** — DC rejects, cloud increments smart-lockout counter.
- **Password expired / must change** — DC returns the sub-status, user is sent to change flow.
- **Account locked / disabled / outside logon hours** — on-prem state blocks sign-in.
- **No agent available** — all agents down/unreachable, sign-in cannot complete.
- **Seamless SSO** — domain-joined device gets a Kerberos-based silent sign-in.

## Security notes

- No password hash is ever stored in the cloud; the plaintext password lives only
  transiently in agent memory during decryption and validation.
- The agent's private key is the crown jewel — protect the agent host as a Tier-0 / Tier-1
  asset; compromise would let an attacker decrypt queued passwords.
- Enable **cloud smart lockout** and **password protection / banned-password** lists so
  spray and brute-force are stopped before reaching the DC.
- Agents use outbound-only connections; do not expose them inbound. Patch and monitor the
  agent service, and alert on agent health (a silent outage denies all sign-ins).
- PTA validates the password but not device or session risk — layer
  [Conditional Access](../../cloud-iam/entra/conditional-access-evaluation/README.md) and
  MFA on top; PTA is one factor only.

## Related diagrams

- [Password Hash Sync](../password-hash-sync/README.md) — the alternative managed-auth option that syncs a hash instead
- [Federated vs Managed Authentication](../federated-vs-managed-auth/README.md) — where PTA sits among the sign-in options
- [Active Directory Interactive Logon](../active-directory-logon/README.md) — the on-prem logon PTA reuses under the hood
- [Conditional Access Evaluation](../../cloud-iam/entra/conditional-access-evaluation/README.md) — risk and policy layered after the password check
- [Primary Refresh Token](../../cloud-iam/entra/primary-refresh-token/README.md) — the device-bound token issued after cloud sign-in

## Files

- [sequence.md](sequence.md) — encrypt, agent pickup, DC validation, and error branches
- [swimlane.md](swimlane.md) — lanes for User, Browser, Cloud, Agent, Directory
- [flowchart.md](flowchart.md) — validation decision logic and error terminals
