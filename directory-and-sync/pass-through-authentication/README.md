# Pass-through Authentication (PTA)

**Status:** ✅ Current

## What it is

Pass-through Authentication lets users sign in to cloud services with their on-premises
password, but the password is **validated live against Active Directory** by a lightweight
**on-prem agent** — no password hash is stored in the cloud. The cloud IdP (Microsoft Entra
ID) collects the credential at sign-in, encrypts it with the agent's public key, and drops it
onto a queue; the on-prem PTA agent picks it up, decrypts it, and calls the local Win32
`LogonUser` API against a domain controller. The DC's yes/no answer is relayed back to the
cloud, which then issues tokens.

The defining property is that authentication **happens on-prem in real time**: on-prem
password policy, account lockout, disabled state, and logon-hour restrictions are enforced
immediately, and **no credential material persists in the cloud**.

## When it is used

- Organizations that want same-password cloud sign-in but, for policy or compliance reasons,
  do **not** want any password hash to leave the datacenter (the differentiator vs
  [Password Hash Sync](../password-hash-sync/README.md)).
- Deployments needing immediate enforcement of on-prem AD state (a just-disabled or
  just-locked account is blocked at the next cloud sign-in with no sync delay).
- As a managed-authentication alternative to legacy
  [ADFS federation](../federated-vs-managed-auth/README.md), removing the on-prem
  authentication endpoint from the internet-facing path.

## Actors

| Actor | Role |
|---|---|
| `User` | Human signing in with their corporate password |
| `IdP` | Cloud identity provider collecting the credential and issuing tokens |
| `Agent` | On-prem PTA agent that decrypts the credential and calls `LogonUser` |
| `Directory` | Active Directory / domain controller validating the password |

## Key details

- The agent makes **only outbound** connections to the cloud (persistent listener on the
  service bus / relay); **no inbound firewall ports** are opened. Deploy multiple agents for
  high availability.
- The password is encrypted with the agent's public key at the cloud, so the cloud service
  itself cannot read it; only an on-prem agent holding the private key can decrypt.
- Validation is a real `LogonUser` call, so **all** AD account controls apply instantly:
  wrong password, must-change-at-next-logon, disabled, locked, expired, logon hours, and
  password expiry are honored with the exact on-prem semantics.
- PTA is typically paired with [Password Hash Sync](../password-hash-sync/README.md) as a
  **failover** so cloud sign-in survives a total on-prem outage.

## Alternate scenarios covered

- **Happy path** — cloud collects password, agent validates against AD, tokens issued.
- **Wrong password / locked / disabled** — DC rejects, cloud denies with the mapped reason.
- **Password expired / must change** — DC signals change-required; user is redirected.
- **No agent available** — request times out; failover to PHS if configured.
- Conditional Access / MFA step-up layered after a successful password check.

## Security notes

- **No password hash in the cloud** is the core benefit, but the on-prem agent decrypts live
  passwords — treat agent hosts as **Tier-0**: hardened, patched, restricted, and monitored.
- The agent's private key protects credentials in transit through the cloud queue; rotate keys
  and register agents securely. Compromise of an agent host exposes plaintext passwords in
  flight.
- Because validation is live, on-prem **lockout and password policy are authoritative** — good
  for consistency, but a badly tuned lockout policy can be weaponized for DoS from the cloud
  sign-in surface; combine with smart lockout and Conditional Access.
- Run **multiple agents** to avoid a single point of failure; a total agent outage blocks
  sign-in unless PHS failover is enabled.
- MFA and risk policy still apply in the cloud on top of the on-prem password result.

## Related diagrams

- [Password Hash Sync](../password-hash-sync/README.md) — the store-a-hash alternative and common PTA failover
- [Federated vs Managed Authentication](../federated-vs-managed-auth/README.md) — PTA as a managed option vs ADFS federation
- [Active Directory Logon](../active-directory-logon/README.md) — the LogonUser / AD validation PTA invokes
- [Conditional Access Evaluation](../../cloud-iam/entra/conditional-access-evaluation/README.md) — policy applied around the sign-in
- [Entra Hybrid Identity Sync](../../cloud-iam/entra/hybrid-identity-sync/README.md) — the directory sync PTA rides alongside

## Files

- [sequence.md](sequence.md) — credential collection, queue, agent validation, alternates
- [swimlane.md](swimlane.md) — lanes for User, IdP, Agent, Directory
- [flowchart.md](flowchart.md) — validation and failover decision logic
