---
title: "MFA Fatigue (Push Bombing) and Number Matching"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# MFA Fatigue (Push Bombing) and Number Matching

**Status:** ✅ Current

## What it is

A defence against the **MFA-fatigue / push-bombing** attack. An attacker who already holds
a victim's password repeatedly triggers sign-ins, spraying the victim's authenticator with
**approve/deny push prompts** until — out of annoyance, confusion, or habit — the victim
taps **Approve**, handing over the account. **Number matching** breaks this: instead of a
one-tap approve, the sign-in screen (the device *initiating* the attempt) displays a
**two- or three-digit number**, and the authenticator app requires the user to **type that
number** to approve. Because the number lives on the initiator's screen — the **attacker's**
screen during an attack — the victim, who never started the sign-in, has **no number to
enter** and cannot approve even if they try. Modern implementations also show **context**
(application name, geographic location, map) and apply **rate-limiting / lockout** and
alerting after repeated denied or unanswered prompts. Plain approve/deny push (🟡) remains
widely deployed but is discouraged precisely because it is defeated by fatigue attacks.

## When it is used

- Any push-based MFA deployment (Microsoft Authenticator, Okta Verify, Duo) hardening
  against account takeover that starts from a stolen or phished password.
- Environments not yet fully on phishing-resistant FIDO2 / passkeys, where push is the
  interactive second factor and must at least resist blind approval.
- As the enforced default after high-profile push-bombing breaches made one-tap approve a
  recognized weakness.

## Actors

| Actor | Role |
|---|---|
| User | Legitimate account holder whose phone runs the authenticator |
| Attacker | Adversary holding the victim's password, spamming sign-in attempts |
| IdP | Identity Provider / authentication server that displays the number and verifies the response |
| Authenticator | The user's authenticator app that prompts for the matching number and context |

## Alternate scenarios covered

- **Legitimate sign-in with number matching** — the user starts the sign-in, sees the
  number on their own screen, enters it in the app, and is granted.
- **Push-bombing attack, number matching mitigates** — the attacker triggers prompts, but
  the number is on the attacker's screen; the victim has nothing correct to enter and denies
  or ignores, so no approval occurs.
- **Wrong number entered** — a guessed or mistyped number fails; repeated failures trip
  rate-limiting / lockout and alerting.
- **Plain approve/deny push (🟡 discouraged)** — one-tap approve with no number; a fatigued
  user can approve an attacker's prompt, which is the exact failure this pattern removes.
- **Report suspicious / deny** — the user actively rejects an unexpected prompt, feeding a
  detection signal.

## Security notes

- **The number defeats blind approval, not phishing relay.** Number matching stops
  push-bombing; it does **not** stop a real-time AiTM proxy that relays a legitimate
  challenge. For that, move to phishing-resistant FIDO2 / passkeys.
- **Show context and cap attempts.** Display app, location, and map, and enforce
  rate-limiting / lockout so an attacker cannot brute-force the two-digit number or grind
  the victim down.
- **Treat unrequested prompts as signal.** A burst of pushes the user did not initiate means
  the password is already compromised — alert, force a password reset, and raise session
  risk.
- **Plain approve/deny is a liability (🟡).** Keep it only where number matching is
  unavailable, and prioritize migrating those users; the one-tap prompt is the mechanism the
  attack relies on.
- **Number matching implies the password already fell.** It is a last line before takeover —
  pair it with leaked-credential detection and adaptive / risk-based policy upstream.

## Related diagrams

- [risk-based-adaptive-authentication](../risk-based-adaptive-authentication/README.md) — the risk engine that should catch the compromised password before push is even reached.
- [step-up-authentication](../step-up-authentication/README.md) — challenging for a stronger factor when risk rises.
- [device-posture-conditional-access](../device-posture-conditional-access/README.md) — a device gate that reduces reliance on push approval alone.
- [WebAuthn / Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md) — the phishing-resistant factor that removes push approval entirely.
- [Windows Hello for Business](../../cloud-iam/entra/windows-hello-for-business/README.md) — a concrete phishing-resistant credential.

## Files

- [sequence.md](sequence.md) — legitimate number-matching sign-in first, then the push-bombing attack it defeats, plus wrong-number and legacy approve/deny alternates.
- [swimlane.md](swimlane.md) — lanes for User, Attacker, IdP, Authenticator.
- [flowchart.md](flowchart.md) — the approve decision with number-match, rate-limit, and lockout terminals.
