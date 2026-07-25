---
title: "Device Code Phishing"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Code Phishing

**Status:** ✅ Current (active threat; defenses current)

## What it is

**Device code phishing** abuses the OAuth 2.0 **device authorization grant** (RFC 8628). That
grant is designed for input-constrained devices (TVs, CLIs, IoT): the device asks the IdP for a
`device_code` plus a short `user_code`, and tells the user to visit a verification URL on a
second device and type the code. In the attack, the **attacker starts the device flow on their
own machine**, obtains a legitimate `user_code`, and then phishes a victim to the **real**
verification URL to enter it. When the victim authenticates and approves, the IdP issues **tokens
to the attacker's polling client** — the victim's browser never receives them.

It abuses the normal [Device Authorization flow](../../authentication/oidc/device-authorization/README.md):
the verification page, the login, and the approval are all genuine. The attacker simply
substitutes their own device-flow session for the "device" the victim believes they are helping.

## When it is used

- **Credential-less initial access / token theft** against users who can be convinced a code is
  routine (an "IT device enrollment", "join this meeting room", "activate your TV app" lure).
- To **bypass MFA**: the victim completes MFA at the real IdP, and the resulting tokens land in
  the attacker's client that has been polling `/token` since before the lure was sent.
- Attractive because it needs **no attacker-controlled reverse proxy or fake page** — the victim
  interacts only with the legitimate IdP, which makes URL-based defenses less effective.

## Actors

| Actor | Role |
|---|---|
| Attacker | Initiates the device flow on their own device; delivers the `user_code` lure; polls `/token` to collect the victim's tokens |
| Victim | The user tricked into entering the attacker's `user_code` and approving at the real verification URL |
| IdP | Legitimate authorization server: issues `device_code` / `user_code`, renders the verification/approval UI, issues tokens on approval |
| API | Resource server whose data the issued tokens expose |
| Defender controls | Conditional access, device-flow restrictions, short code lifetimes, verified device binding, user education, sign-in monitoring |

## Alternate scenarios covered

- **Conditional access blocks the grant (attack prevented):** policy restricts the device-code
  grant to compliant/managed devices or trusted networks, so the attacker's off-network polling
  client is denied a token even after the victim approves.
- **Short `user_code` lifetime + slow-down:** the code expires before the victim acts, or the
  attacker's polling is throttled, shrinking the phishing window and forcing re-initiation
  (more signal).
- **Verified device binding / approval context shown:** the approval screen surfaces *what* is
  being authorized (app, location, "you did not start this?") so an alert victim cancels; audit
  logs then flag the attempt.

## Security notes

Device code phishing is a **social-engineering + flow-abuse** problem: the crypto and the login
are valid, and the victim only ever touches the real IdP. Defense combines **restricting where
the device grant is allowed**, **shrinking the code window**, and **making the approval
unambiguous** so the victim (or a policy) refuses.

### Detection

- **Anomalous device-code sign-ins:** approval from a user whose token is then used from an
  unrelated IP/device, or device-flow use by users/apps that never legitimately use it.
- **Correlate the approval location with subsequent token use** — a mismatch (victim in one
  place, first API calls from another) is a strong signal.
- **Spikes in `device_code` requests** or repeated `authorization_pending` polling from unusual
  clients; failed approvals where the user cancelled after "you did not start this?".
- **Alert on device-grant use by high-value accounts** and on tokens issued via device flow to
  first-party apps that normally use interactive code flow.

### Mitigation

- **Restrict or disable the device-code grant** via conditional access — allow it only for the
  specific apps/devices that need it, and require compliant/managed devices or trusted networks.
- **Short `user_code` lifetimes** and enforced polling slow-down to compress the attack window.
- **Verified device binding** and a clear approval screen that shows the app, request origin,
  and an explicit "did you start this?" so users can refuse unexpected prompts.
- **User education**: never enter a device code you did not personally generate on a device in
  front of you; treat unsolicited codes as phishing.
- **Continuous access evaluation / short token lifetimes** so any tokens that do leak are quickly
  re-evaluated and can be revoked.

## Related diagrams

- [Device Authorization](../../authentication/oidc/device-authorization/README.md) — the legitimate input-constrained flow whose verification step is abused here.
- [AiTM MFA Phishing](../aitm-mfa-phishing/README.md) — a sibling MFA-bypass technique using a reverse proxy instead of the device grant.
- [Token Theft & Replay](../token-theft-replay/README.md) — what the attacker does with the device-flow tokens once collected.

## Files

- [sequence.md](./sequence.md) — the device-code phishing path, then conditional-access / short-lifetime / approval-context defenses in `alt`/`opt` blocks.
- [swimlane.md](./swimlane.md) — Attacker / Victim / IdP / Defender-controls lanes.
- [flowchart.md](./flowchart.md) — where conditional access and code expiry force a deny/detect terminal.
