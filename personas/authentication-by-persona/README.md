# Authentication by Persona

**Status:** ✅ Current

## What it is

One flow name — "authentication" — but five materially different runs depending on who the
principal is. This diagram set overlays the personas so the forks are visible side by side
rather than buried in five separate base diagrams:

- **Workforce** — corporate SSO (SAML or OIDC) with MFA always on and risk-based step-up.
- **Consumer** — social login, passwordless email/magic-link, or passkey; MFA optional.
- **Partner/B2B** — invitation, then home-realm discovery and federation to the partner's
  own IdP, whose assertion carries the (partner-side) MFA claim.
- **Privileged** — a base human login **plus** a step-up and just-in-time (PIM) elevation
  before any admin action.
- **Workload** — non-interactive machine auth: OIDC client-credentials or mutual TLS; no
  user, no MFA, no browser.

It does not redraw the base mechanisms — it references them and shows only what the persona
changes. Read the linked base flow for the wire-level detail.

## Actors

| Actor | Role |
|---|---|
| `User` | Human principal (workforce, consumer, partner, or privileged operator) |
| `Client` | App / RP / SP the principal is signing in to |
| `IdP` | Local identity provider / authorization server |
| `PartnerIdP` | External organization's IdP (Partner/B2B only) |
| `PIM` | Privileged identity management / JIT elevation service |
| `Workload` | Non-human service or machine principal |

## Alternate scenarios covered

Each persona is an `alt` branch in the sequence, a lane group in the swimlane, and a
top-level decision branch in the flowchart:

- **Workforce SSO + MFA** — redirect to corporate IdP, session or credential + MFA, assertion back.
- **Consumer social / passwordless** — social IdP or passkey / magic-link; step-up only on sensitive action.
- **Partner/B2B invitation-federation** — invite redeem once, then federate to `PartnerIdP` on each login.
- **Privileged step-up + PIM** — authenticated base session, then phishing-resistant step-up and time-boxed elevation.
- **Workload client-credentials / mTLS** — token or mTLS handshake, no interaction.

## Security notes

- Never treat personas as trust levels by name: bind them to **verifiable claims**
  (issuer, `amr`/authn-context, client certificate) — a self-asserted "I am a partner" is not a persona.
- Partner MFA is only as strong as the partner IdP; require an `amr`/`AuthnContextClassRef`
  claim and step up locally for high-risk local actions rather than trusting the assertion blindly.
- Privileged elevation must be **just-in-time and time-boxed**; a standing admin role defeats
  the step-up. Log the elevation with its justification and expiry.
- Workload credentials are bearer secrets or certificates: prefer short-lived tokens and
  mTLS with rotation; never let a workload fall back to an interactive path.
- Enforce phishing-resistant factors (passkey / hardware key) for Privileged and for
  Workforce high-risk step-up; SMS/voice OTP is deprecated as a primary factor.

## Related diagrams

- [SP-Initiated SAML SSO](../../saml/sp-initiated-sso/README.md) / [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — workforce base flows
- [WebAuthn / Passkey](../../tokenless/webauthn-passkey-authentication/README.md) / [Magic Link](../../tokenless/magic-link/README.md) — consumer passwordless base flows
- [OIDC Client Credentials](../../oidc/client-credentials/README.md) / [Mutual TLS](../../tokenless/mutual-tls/README.md) — workload base flows
- [MFA Enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — where the factors used here are registered
- [Personas reference](../README.md) — archetypes and full variance matrix
- privileged-access/ and adaptive-access/ (parallel categories) — PIM/JIT and risk-based step-up detail

## Files

- [README.md](README.md) — this document
- [sequence.md](sequence.md) — per-persona `alt` message exchange
- [swimlane.md](swimlane.md) — lanes with a persona router
- [flowchart.md](flowchart.md) — persona-type decision tree
