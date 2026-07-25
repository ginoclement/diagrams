# Risk-Based Adaptive Authentication

**Status:** ✅ Current

## What it is

An authentication flow where the Identity Provider does not apply a fixed factor policy.
Instead, at sign-in it gathers **signals** — device fingerprint and posture, geolocation,
login velocity, IP / ASN reputation, threat intelligence, and behavioural history — and
sends them to a **risk engine** that returns a **risk score / level** (for example
`low` / `medium` / `high`). A policy maps that level to one of three outcomes:

- **Allow** — the primary factor is sufficient; issue tokens.
- **Step-up** — assurance is insufficient for the risk; challenge for a stronger or
  additional factor (ideally phishing-resistant), then re-evaluate.
- **Deny** — risk is too high or a hard signal (known-bad IP, impossible travel,
  leaked-credential hit) fired; block and alert.

The result is that low-risk, familiar sign-ins are frictionless while risky ones are
challenged or stopped — the same credentials, a context-dependent gate.

## When it is used

- Workforce and consumer IdPs that want to minimise MFA prompts on trusted context while
  still catching account-takeover attempts.
- As the front-door complement to [Continuous Access Evaluation](../continuous-access-evaluation/README.md),
  which handles the *mid-session* re-evaluation this flow only does at sign-in.
- Anywhere a static "always MFA" or "never MFA" policy is too blunt.

## Actors

| Actor | Role |
|---|---|
| User | Human signing in |
| Client | App / relying party (browser or native) initiating authentication |
| IdP | Identity Provider orchestrating auth and enforcing the policy decision |
| Risk engine | Scores the collected signals into a risk level (may be a module of the IdP or an external service) |
| Signal sources | Device / posture agents, geo-IP and reputation feeds, threat intel, leaked-credential databases, behavioural history |

## Alternate scenarios covered

- **Low risk → allow** — trusted device, usual location, good reputation; no extra prompt.
- **Medium risk → step-up** — new device or unusual location triggers an additional factor;
  on success, risk is recomputed and access granted.
- **High risk → deny** — impossible travel, known-bad IP, or a leaked-credential match
  blocks the sign-in and raises an alert.
- **Step-up failure** — the user cannot satisfy the challenge; treated as deny.
- **Signal source unavailable** — the engine degrades to a conservative default (fail
  toward step-up, not toward allow).

## Security notes

- **Fail closed on missing signals.** An unreachable risk engine or signal feed must not
  silently downgrade to "allow"; default to step-up or deny per policy.
- **Prefer phishing-resistant step-up.** A step-up to SMS OTP can be defeated by AiTM
  relay — see AiTM MFA Phishing *(planned)*. Prefer
  FIDO2 / passkeys as the step-up factor
  ([Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md)).
- **Signals are attacker-influenced.** Device fingerprints, `X-Forwarded-For`, and
  geolocation can be spoofed; weight hard signals (leaked-credential hits, impossible
  travel) over soft ones and never trust client-asserted posture without device attestation.
- **Record the decision.** Log the risk level, the contributing signals, and the outcome
  for audit and detection tuning; emit the achieved assurance (`acr`/`amr`) in the token.
- **Avoid prompt fatigue.** Over-aggressive step-up trains users to approve blindly —
  the failure mode exploited in MFA fatigue *(planned)*.

## Related diagrams

- [Step-up Authentication](../step-up-authentication/README.md) — the mid-session variant of the step-up branch here.
- [Continuous Access Evaluation](../continuous-access-evaluation/README.md) — re-scoring *after* the session is issued.
- Device Posture Conditional Access *(planned)* — the device-signal half of the score, as a hard gate.
- Impossible Travel Anomaly *(planned)* — the velocity signal that most often forces the deny branch.
- Policy Decision / Enforcement *(planned)* — the PDP/PEP pattern this decision implements.
- [Conditional Access Evaluation (Entra)](../../cloud-iam/entra/conditional-access-evaluation/README.md) — a vendor realisation of this flow.

## Files

- [sequence.md](sequence.md) — signal collection, scoring, and the allow / step-up / deny outcomes.
- [swimlane.md](swimlane.md) — lanes for User, Client, IdP, Risk engine, Signal sources.
- [flowchart.md](flowchart.md) — the risk-to-outcome decision tree with explicit terminals.
