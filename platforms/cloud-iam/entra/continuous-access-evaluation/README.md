---
title: "Continuous Access Evaluation (CAE)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Continuous Access Evaluation (CAE)

**Status:** 🔵 Emerging

## What it is

Continuous Access Evaluation closes the gap left by the ~1-hour lifetime of OAuth access
tokens. Normally a token stays valid until it expires even if the user is disabled or their
risk spikes. With CAE, the identity provider (Microsoft Entra ID) and CAE-capable resource
providers (Exchange Online, SharePoint Online, Microsoft Graph, Teams) maintain a channel
so that **critical events** invalidate tokens in near real time. When a critical event
occurs, the resource provider rejects the presented token with a **claims challenge**
(`WWW-Authenticate: Bearer ... claims=...`, `error="insufficient_claims"`); the client is
forced back to Entra, where the current state (disabled account, revoked session, changed
CA) is re-evaluated before a new token is issued. CAE tokens are also **long-lived**
(up to ~28 hours) precisely because they can be revoked on demand.

## When it is used

- Microsoft 365 workloads that support CAE, for both revocation events (account disabled,
  password reset, admin-initiated session revoke, high user risk) and CA policy changes.
- IP-location enforcement in near real time (a token used from outside an allowed network
  is challenged).

## Actors

| Actor | Role |
|---|---|
| User | Human whose session may be revoked mid-stream |
| Client | App / browser holding the access token and handling the claims challenge |
| Entra | Entra ID issuing CAE-enabled tokens and publishing critical events |
| Resource | CAE-capable resource provider evaluating tokens and issuing the challenge |
| Admin | Actor triggering a critical event (disable user, revoke sessions, change policy) |

## Alternate scenarios covered

- Normal access with a long-lived CAE token (no event).
- User disabled / sessions revoked → next call is challenged and blocked.
- Sign-in risk elevated by Identity Protection → re-evaluation required.
- CA policy change → resource requires a fresh token reflecting the new policy.
- IP outside allowed location → claims challenge on the mismatched call.
- Client that does not understand claims challenges (falls back to token expiry).

## Security notes

- CAE turns revocation from "eventually, at token expiry" into "within minutes", shrinking
  the window an attacker has with a stolen or newly-invalid token.
- Clients must be built to handle the claims challenge; a non-CAE-aware client only benefits
  from standard (shorter) token lifetimes.
- CAE complements but does not replace [Conditional Access](../conditional-access-evaluation/README.md) —
  CA decides policy, CAE enforces changes to that decision mid-session.
- Token binding and phishing-resistant auth still matter; CAE limits blast radius, it does
  not stop the initial theft.

## Related diagrams

- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — the policy engine whose changes CAE propagates
- [Primary Refresh Token](../primary-refresh-token/README.md) — device-bound token also subject to revocation
- [PIM JIT Elevation](../pim-jit-elevation/README.md) — CAE can revoke an elevated token when activation ends
- [OIDC Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md) — the token protocol CAE extends
- [Adaptive / risk-based access](../../../../authentication/adaptive-access/risk-based-adaptive-authentication/README.md) — risk signals that become critical events

## Files

- [sequence.md](./sequence.md) — long-lived token, critical event, claims challenge, re-evaluation
- [swimlane.md](./swimlane.md) — lanes for User, Client, Entra, Resource, Admin
- [flowchart.md](./flowchart.md) — token acceptance vs challenge decision logic
