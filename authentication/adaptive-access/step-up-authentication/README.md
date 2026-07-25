---
title: "Step-Up Authentication"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9470"
---

# Step-Up Authentication

**Status:** ✅ Current

## What it is

A pattern where an already-authenticated session is **not** sufficient for a particular
**sensitive action** (a wire transfer, changing MFA methods, viewing PII, an admin
operation). The relying party detects that the current session's assurance is too low and
asks the IdP to **raise it mid-session** by challenging for a stronger or more recent factor,
then re-issues a token that carries the elevated assurance.

The mechanism is standardised:

- **OIDC** — the client re-sends the user to `/authorize` with `acr_values` (requested
  authentication-context class) and/or `max_age=0` to force freshness; the IdP asserts the
  achieved level in the `acr` claim. **RFC 9470** defines the `acr_values` /
  `max_age` **authentication-context request** so a resource server can trigger step-up via
  a `WWW-Authenticate` challenge carrying `insufficient_user_authentication` and the
  required `acr_values` / `max_age`.
- **SAML** — an `AuthnRequest` with `RequestedAuthnContext` (a `AuthnContextClassRef` and
  `Comparison="minimum"/"exact"`) demands a class; `ForceAuthn="true"` forces freshness.

The distinction from [risk-based auth](../risk-based-adaptive-authentication/README.md): here
the trigger is a **resource-side action**, not a sign-in-time risk score. They compose — a
risk engine can also demand step-up.

## When it is used

- Financial, healthcare, and admin flows where a subset of operations needs higher assurance
  than routine access.
- "Recent authentication" requirements (`auth_time` / `max_age`) — e.g. re-prompt before a
  password or security-key change even if the session is otherwise valid.
- Escalating from a weak factor (password only) to a phishing-resistant one for the
  sensitive step, without forcing it on every request.

## Actors

| Actor | Role |
|---|---|
| User | Human already signed in, now attempting a sensitive action |
| Client | App / RP that holds the current session and initiates step-up |
| API | Resource server that returns the `insufficient_user_authentication` challenge (RFC 9470) |
| IdP | Identity Provider that evaluates `acr_values` / `max_age` and performs the challenge |

## Alternate scenarios covered

- **Already meets requirement** — the session's `acr` / `auth_time` already satisfy the
  demand; no prompt, action proceeds.
- **Step-up needed → satisfied** — the IdP challenges, the user completes a stronger factor,
  a token with elevated `acr` is issued, the action proceeds.
- **Step-up failed / cancelled** — the user cannot or will not complete; the sensitive
  action is refused while the base session remains valid.
- **Freshness only** — the factor is strong enough but too old; `max_age` forces re-auth
  with the same factor.

## Security notes

- **Bind assurance to the token, not to app memory.** The RP must check `acr` and
  `auth_time` in the freshly issued token, not merely remember "we prompted"; otherwise the
  elevation can be replayed or skipped.
- **Prefer phishing-resistant step-up.** Stepping up to SMS/push can be relayed by AiTM —
  see [AiTM MFA Phishing](../../../threat-defense/aitm-mfa-phishing/README.md). Step up to
  FIDO2 / passkeys ([Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md)).
- **Scope the elevation.** A step-up token should be short-lived and, ideally, tied to the
  specific operation (transaction-bound / claims challenge) so it cannot authorise unrelated
  sensitive actions.
- **Do not weaken the base session.** A failed step-up must refuse only the sensitive action,
  not sign the user out or downgrade unrelated access.
- **Use standard signalling.** RFC 9470's `WWW-Authenticate: insufficient_user_authentication`
  keeps the trigger interoperable rather than app-specific.

## Related diagrams

- [Risk-Based Adaptive Authentication](../risk-based-adaptive-authentication/README.md) — the sign-in-time source of a step-up demand.
- [Continuous Access Evaluation](../continuous-access-evaluation/README.md) — a claims challenge that similarly re-engages the IdP mid-session.
- [MFA Fatigue / Number Matching](../mfa-fatigue-number-matching/README.md) — hardening the factor the step-up challenges with.
- [Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the grant the `/authorize` step-up re-runs.
- [Scopes, Claims, Entitlements](../../../authorization/scopes-claims-entitlements/README.md) — how `acr` / `amr` claims are consumed downstream.

## Files

- [sequence.md](./sequence.md) — the RFC 9470 challenge, `acr_values` re-authorization, and elevated-token issuance.
- [swimlane.md](./swimlane.md) — lanes for User, Client, API, IdP.
- [flowchart.md](./flowchart.md) — the assurance-comparison decision with proceed / refuse terminals.
