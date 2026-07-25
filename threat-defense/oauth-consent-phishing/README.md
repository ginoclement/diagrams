# OAuth Consent Phishing (Illicit Consent Grant)

**Status:** ✅ Current (active threat; defenses current)

## What it is

**OAuth consent phishing** (the *illicit consent grant* attack) tricks a user into granting a
**malicious OAuth application** delegated permissions to their account. Instead of stealing a
password, the attacker registers (or impersonates) an app, then lures the victim to a genuine
IdP consent screen. When the victim clicks **Accept**, the IdP issues the attacker's app real
**access and refresh tokens** for the granted scopes (mail, files, offline access). The
attacker now holds durable, token-based access that **survives password resets and often MFA**,
because the tokens were issued by the legitimate authorization server to a consented app.

It abuses the normal [OIDC / OAuth authorization code flow](../../oidc/authorization-code/README.md):
every step — the `/authorize` redirect, the login, the consent prompt, the token issuance — is
legitimate. The only thing "wrong" is that the user was socially engineered into consenting to
an attacker-controlled client requesting excessive scopes.

## When it is used

- **Initial access and persistence** without credential theft. The attacker never needs the
  victim's password, so credential rotation does not evict them; only revoking the app grant does.
- To **bypass MFA**: MFA is satisfied during the victim's own interactive login, and the
  resulting refresh token lets the app mint new access tokens indefinitely with no further prompt.
- Common lures: a "document viewer", "security add-in", or "productivity" app link delivered by
  email or chat, often naming a look-alike publisher.

## Actors

| Actor | Role |
|---|---|
| Attacker | Registers or impersonates a malicious OAuth app; sends the consent lure; redeems and reuses the granted tokens |
| Victim | The user who is phished into approving the app's requested scopes at a real consent screen |
| IdP | Legitimate authorization server: hosts `/authorize` and `/token`, renders the consent UI, issues tokens for consented scopes |
| API | Resource server (mail, files, directory) whose data the granted scopes expose |
| Defender controls | App governance / risky-app detection, publisher verification, admin-consent workflow, consent policy, token/grant revocation |

## Alternate scenarios covered

- **Admin consent required (attack blocked at consent):** user consent for the requested scopes
  is disabled by policy, so the victim's click routes to an **admin approval request** instead of
  issuing tokens — a human reviewer denies the unknown app.
- **Publisher verification / unverified app blocked:** policy blocks or hard-warns on apps from
  unverified publishers, so the phishing app never reaches a grantable consent screen.
- **Risky-app detection revokes after grant:** even if consent slips through, app-governance
  anomaly detection flags the new app's mass mailbox/file reads and **revokes the grant and
  refresh tokens**, cutting off access.

## Security notes

Consent phishing is an **authorization** problem, not an authentication one — the crypto and the
login are all valid. Defense therefore centers on **governing which apps can be consented to** and
on **detecting/revoking** grants that should never have been made.

### Detection

- **Alert on new/rare app grants**, especially requests for high-impact scopes (`Mail.Read`,
  `Mail.Send`, `Files.Read.All`, `offline_access`, directory read) by apps with low prevalence.
- **App-governance anomalies:** a freshly consented app suddenly enumerating many mailboxes or
  files, spikes in Graph/API calls, or downloads shortly after first consent.
- **Unverified or look-alike publishers**, reply-URLs on attacker-controlled domains, and app
  display names that impersonate known vendors.
- **Consent audit logs:** review `Add app role assignment` / `Consent to application` events and
  correlate the granting user with the app's later token use from unusual locations.

### Mitigation

- **Restrict user consent** to verified publishers and a low-risk scope allowlist; route
  everything else through an **admin consent workflow** with human review.
- **Publisher verification** requirement so unverified apps cannot obtain broad delegated scopes.
- **App governance / risky-app policies** that automatically disable or revoke apps exhibiting
  risky behavior, plus one-click **revoke grant + refresh tokens** during response.
- **Least-privilege scopes** and periodic **access reviews** of existing app grants to prune
  stale or over-permissioned consents.
- **User education**: treat unexpected consent prompts like phishing; verify the app and publisher
  before approving.

## Related diagrams

- [OIDC Authorization Code (confidential)](../../oidc/authorization-code/README.md) — the legitimate delegated-authorization flow whose consent step is abused here.
- [Refresh Token](../../oidc/refresh-token/README.md) — the durable token the malicious app keeps; revocation and rotation matter for containment.
- [Token Theft & Replay](../token-theft-replay/README.md) — what an attacker does with the tokens once obtained.

## Files

- [sequence.md](sequence.md) — the consent-phishing path, then admin-consent / publisher-verification / risky-app defenses in `alt`/`opt` blocks.
- [swimlane.md](swimlane.md) — Attacker / Victim / IdP / Defender-controls lanes.
- [flowchart.md](flowchart.md) — where consent policy and app governance force a deny/detect terminal.
