# OAuth Consent Phishing (Illicit Consent Grant)

**Status:** ✅ Current (active threat; defenses current)

## What it is

**OAuth consent phishing** (a.k.a. **illicit consent grant** or "OAuth app phishing") tricks
a user into **granting a malicious/attacker-controlled OAuth application access to their data
and APIs**. Instead of stealing a password, the attacker abuses the legitimate
[OAuth consent](../../authorization/oauth-consent-authorization/README.md) /
[authorization code](../../oidc/authorization-code/README.md) flow: the victim is sent a real
authorization URL to the *real* IdP, authenticates normally (MFA included), and clicks
**Consent** — handing the attacker's app **delegated tokens** (access + refresh) for scopes
like read mail, read files, offline access.

Because the tokens are issued by the real IdP to a registered app, this **survives password
resets and MFA** — the grant persists until it is explicitly revoked. Nothing is "hacked";
the user was social-engineered into authorizing an app.

## When it is used

- **Initial access / persistence** in cloud identity (Microsoft 365, Google Workspace). The
  lure is a convincing email ("review document", "authorize this add-in") linking to a real
  consent screen for a malicious app.
- To exfiltrate mail/files, send phishing from the victim's mailbox, and maintain long-lived
  API access without ever touching the password.

## Actors

| Actor | Role |
|---|---|
| Attacker | Registers/controls the malicious OAuth app and receives the delegated tokens |
| Victim | The user lured into granting consent |
| IdP | Authorization server issuing tokens after consent (behaves correctly) |
| API | Resource (mail/files/graph) the granted scopes unlock |
| Directory | Tenant holding app registrations, consent policy, and enterprise apps |
| Defender controls | Admin consent workflow, publisher verification, app governance, risky-consent detection |

## Alternate scenarios covered

- **Admin-consent required for risky scopes (attack blocked at grant):** users cannot consent
  to sensitive scopes; the request goes to an admin who denies the unknown app.
- **Publisher-verification / app-attestation policy:** unverified-publisher apps are blocked
  or clearly flagged, so the lure's app can't be consented to.
- **App governance / anomaly detection (post-grant):** a newly-consented app immediately
  pulling large volumes of mail/files is flagged and its tokens revoked.

## Security notes

Consent phishing defeats password and MFA controls because it never attacks them — it abuses
**authorization**. Defense is **restrict who can consent to what**, **only allow trustworthy
apps**, and **detect/revoke** malicious grants fast.

### Detection

- **New/abnormal consent grants:** alert on consents to apps with **unverified publishers**,
  **recently registered** apps, apps with **sensitive scopes** (mail.read, files.read.all,
  offline_access), or a spike of users consenting to the same new app (campaign signal).
- **Post-consent behavior:** the app immediately enumerating/downloading mail or files,
  creating inbox rules, or accessing from anomalous IPs — surface via app-governance/CASB.
- **Redirect-URI anomalies** and consent from risky sign-ins; correlate with the phishing
  email delivery.

### Mitigation

- **Restrict user consent**: disable it, or allow it only for **verified publishers** and
  **low-risk delegated scopes**; route everything else through an **admin consent workflow**.
- **Publisher verification** and app-vetting policies so unverified/unknown apps can't be
  granted access.
- **App governance / continuous monitoring** to auto-flag and **revoke** risky OAuth grants;
  regularly review enterprise-app consents and remove stale/unused ones.
- **User education**: teach users to scrutinize consent prompts (who is the app, what scopes,
  is offline access really needed) and to report unexpected authorization requests.
- **Revocation runbook:** on detection, revoke the app's grants and refresh tokens tenant-wide.

## Related diagrams

- [OAuth consent authorization](../../authorization/oauth-consent-authorization/README.md) — the legitimate consent flow this abuses.
- [OIDC Authorization Code](../../oidc/authorization-code/README.md) — the code/token exchange the malicious app rides on.
- [Device Code Phishing](../device-code-phishing/README.md) — a sibling token-phishing technique.
- [Token Theft & Replay](../token-theft-replay/README.md) — what the attacker does with the tokens once granted.
- [Scopes, claims & entitlements](../../authorization/scopes-claims-entitlements/README.md) — why scope minimization matters.

## Files

- [sequence.md](sequence.md) — the consent-phishing path, with consent policy / publisher verification / governance defenses in `alt`/`opt` blocks.
- [swimlane.md](swimlane.md) — Attacker / Victim / IdP / Defender-controls lanes.
- [flowchart.md](flowchart.md) — where consent policy and app governance force deny/detect terminals.
