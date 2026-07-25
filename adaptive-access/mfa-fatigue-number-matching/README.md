# MFA Fatigue and Number Matching

**Status:** ✅ Current (number matching); 🟡 Legacy (plain approve/deny push)

## What it is

**Push-based MFA** lets a user approve a sign-in by tapping *Approve* on a prior-registered
phone. Its weakness is **MFA fatigue** (a.k.a. push bombing / prompt spamming): an attacker
who already has the victim's password triggers sign-in after sign-in, flooding the phone
with push prompts until the victim — annoyed, confused, or tricked into thinking it is a
glitch — taps *Approve*. The second factor is defeated with a single careless tap.

**Number matching** is the mitigation. Instead of a bare *Approve/Deny*, the sign-in screen
displays a **two-digit (or longer) number** that the user must **type into the
authenticator app**. Because the number lives on the screen the attacker controls — not on
the victim's phone — a victim who is not actually looking at the legitimate sign-in cannot
supply it. A blind tap is no longer enough; the approval requires **proof the user is
present at the real sign-in**. Often paired with **additional context** (app name, and the
sign-in's geographic location) shown in the prompt.

This is the same mechanism family as [risk-based](../risk-based-adaptive-authentication/README.md)
and [step-up](../step-up-authentication/README.md) auth — number matching just hardens the
*push factor itself* against a specific social-engineering attack.

## When it is used

- Any deployment still using push-based MFA; number matching is now the recommended default
  and plain approve/deny is being retired.
- As the challenge factor in a step-up or risk-based flow when the stronger option
  (FIDO2 / passkey) is unavailable to the user.

## Actors

| Actor | Role |
|---|---|
| User | Human whose phone receives push prompts |
| Client | The sign-in surface (browser / app) that displays the matching number |
| IdP | Identity Provider generating the number and validating the typed response |
| Authenticator | The user's registered push app that shows context and collects the typed number |
| Attacker | Party with the stolen password triggering the flood (shown only in the fatigue alternate) |

## Alternate scenarios covered

- **Legitimate sign-in** — user reads the number on the real screen, types it, approves.
- **Push bombing, plain approve/deny (🟡)** — attacker floods prompts; victim taps *Approve*
  and is compromised. This is the failure number matching exists to prevent.
- **Push bombing, number matching (✅)** — attacker floods prompts, but has no number to give
  the victim; the victim cannot approve blindly, so the attack fails.
- **Wrong number entered** — mismatch is rejected; repeated failures / floods trigger
  lockout or a risk signal.

## Security notes

- **Number matching defeats blind approval, not phishing relay.** An AiTM proxy that shows
  the victim the *real* number can still relay it — see
  [AiTM MFA Phishing](../../threat-defense/aitm-mfa-phishing/README.md). Only origin-bound
  factors (FIDO2 / passkeys) stop that, so prefer
  [passkeys](../../tokenless/webauthn-passkey-authentication/README.md) where possible.
- **Rate-limit and alert on floods.** Repeated denied / ignored prompts for one account are
  themselves a strong attack signal; feed them to the
  [risk engine](../risk-based-adaptive-authentication/README.md) and lock out after a threshold.
- **Show context.** App name and sign-in location in the prompt help the user recognise a
  request they did not initiate.
- **The root cause is the stolen password.** Number matching mitigates a symptom;
  phishing-resistant primary auth removes the precondition.
- **Never fall back silently.** If number matching cannot be shown, do not drop to plain
  approve/deny without a policy decision.

## Related diagrams

- [Risk-Based Adaptive Authentication](../risk-based-adaptive-authentication/README.md) — consumes the flood signal and can block.
- [Step-up Authentication](../step-up-authentication/README.md) — where push / number matching is used as a challenge factor.
- [AiTM MFA Phishing](../../threat-defense/aitm-mfa-phishing/README.md) — the attack number matching does *not* stop.
- [Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md) — the phishing-resistant alternative that removes the fatigue surface.

## Files

- [sequence.md](sequence.md) — legitimate number match, then plain-push bombing vs number-matched bombing.
- [swimlane.md](swimlane.md) — lanes for User, Client, IdP, Authenticator, Attacker.
- [flowchart.md](flowchart.md) — the approve / deny / flood-detected decision tree.
