# Federated vs Managed Authentication

**Status:** ✅ Current

## What it is

Two ways a cloud identity service (Entra ID / Microsoft 365) can verify a user's
credentials, contrasted side by side:

- **Managed (cloud) authentication** — the cloud validates the credential itself. Either
  the password hash is synchronized to the cloud
  ([Password Hash Sync](../password-hash-sync/README.md)) and checked there, or the
  password is validated in real time on-prem via a
  [Pass-Through Authentication](../pass-through-authentication/README.md) agent while the
  **token is still minted by the cloud**. In both cases the sign-in UI, protocols, and
  session live in the cloud.
- **Federated authentication** — the cloud does not check the credential at all. It
  **redirects the browser to an on-premises Identity Provider** (classically ADFS via
  WS-Federation or SAML). The on-prem IdP authenticates the user against Active Directory
  and returns a signed token; the cloud validates that token's signature against the
  federation trust and issues its own session.

The practical difference is *where the credential is verified and who mints the token*.
Managed keeps everything cloud-side (with PTA reaching back for the check); federation
hands the authentication moment to an on-prem system you must run and secure.

## When it is used

- **Managed** is the recommended default for new tenants: fewer moving parts, cloud
  resilience, native support for Conditional Access and Seamless SSO.
- **Federation** is used when an organization needs on-prem control of the authentication
  event — third-party MFA at the IdP, smart-card/PKI sign-in, legacy claims rules, or a
  contractual requirement that passwords are only ever validated on-prem.
- Many organizations are **migrating off ADFS** to PHS or PTA to shed the ADFS/WAP farm.

## Actors

| Actor | Role |
|---|---|
| `User` | Human signing in to a cloud app |
| `Browser` | User agent following redirects between cloud and on-prem IdP |
| `Cloud` | Cloud auth service (Entra ID); decides managed vs federated per domain |
| `IdP` | On-prem federation service (ADFS) — used only on the federated path |
| `Directory` | Active Directory verifying the credential |

## Key details

- The cloud chooses the path from the **domain's authentication setting** (Managed vs
  Federated) resolved during **home-realm discovery** after the user enters their UPN.
- On the **managed** path the credential check is PHS (hash compared in cloud) or PTA
  (agent validates on-prem, cloud still issues the token) — see those diagrams for detail.
- On the **federated** path the cloud emits a WS-Federation / SAML request; ADFS
  authenticates against AD and returns a **signed SAML/JWT token**; the cloud validates
  the signature against the **federation trust certificate** and issues its own session.
- **Token-signing certificate rollover** at ADFS is the classic federated outage cause —
  if the cloud's trusted cert and ADFS's active cert drift, all sign-ins fail.

## Alternate scenarios covered

- **Managed happy path** — cloud validates (PHS or PTA), issues token.
- **Federated happy path** — redirect to ADFS, AD auth, signed token back, cloud session.
- **Federated with expired/mismatched signing certificate** — trust broken, sign-in fails.
- **On-prem IdP unreachable** — federated sign-in cannot complete (no cloud fallback).
- **Home-realm discovery** — cloud routes the same user differently by domain setting.

## Security notes

- **🟡 ADFS federation is Legacy for most tenants.** It adds an internet-facing ADFS/WAP
  farm, token-signing-certificate lifecycle, and a high-value SAML token-signing key —
  the target of "Golden SAML" forgery. Prefer managed auth unless a specific requirement
  forces federation.
- Federation moves the trust anchor on-prem: protect the ADFS token-signing key as a
  Tier-0 secret, monitor for anomalous token issuance, and rotate certificates on schedule.
- Managed auth centralizes control in the cloud, enabling
  [Conditional Access](../../cloud-iam/entra/conditional-access-evaluation/README.md),
  smart lockout, and password protection that federation must otherwise reimplement at ADFS.
- Whichever path is chosen, MFA and risk evaluation should be enforced; the credential
  check alone is one factor.

## Related diagrams

- [Pass-Through Authentication](../pass-through-authentication/README.md) — the managed path that validates on-prem in real time
- [Password Hash Sync](../password-hash-sync/README.md) — the managed path that syncs a hash to the cloud
- [SP-Initiated SSO](../../saml/sp-initiated-sso/README.md) — the SAML redirect pattern the federated path uses
- [IdP-Initiated SSO](../../saml/idp-initiated-sso/README.md) — the unsolicited SAML variant from an on-prem IdP
- [Conditional Access Evaluation](../../cloud-iam/entra/conditional-access-evaluation/README.md) — policy layered on the managed path
- [Active Directory Interactive Logon](../active-directory-logon/README.md) — the AD credential check both paths ultimately rely on

## Files

- [sequence.md](sequence.md) — managed vs federated exchanges with alt blocks
- [swimlane.md](swimlane.md) — lanes for User, Browser, Cloud, IdP, Directory
- [flowchart.md](flowchart.md) — the per-domain routing decision and error terminals
