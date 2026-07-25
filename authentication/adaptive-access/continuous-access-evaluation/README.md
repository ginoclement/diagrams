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

The bearer-token model has a structural gap: an access token is valid until it **expires**,
so a token minted with a one-hour lifetime stays honoured for up to an hour even if the
user is disabled, the password is reset, or the session is flagged as risky the moment
after issuance. **Continuous Access Evaluation** closes that gap by letting the resource
server and IdP keep talking *after* the token is issued:

1. The IdP issues a longer-lived access token but marks it **CAE-capable** (the resource
   server advertises that it understands CAE).
2. On a **critical event** — account disabled/deleted, password reset, MFA revoked,
   admin-forced sign-out, elevated user risk, or a network-location change — the IdP (or a
   signal publisher) records that the session should be re-evaluated.
3. When the client next calls the API, the resource server sees the session no longer meets
   policy and returns a **claims challenge** (`WWW-Authenticate` with a
   `claims` parameter) instead of serving the request.
4. The client takes that challenge back to the IdP, which re-evaluates conditions and either
   issues a fresh token or blocks — enforcement now happens in **near-real-time** rather than
   at token expiry.

CAE is model-agnostic here; the concrete Microsoft Entra realisation (with its event list,
IP-address enforcement, and CAE `xms_cc` client capability) is a sibling diagram.

## When it is used

- Long-lived sessions to APIs (mail, files, chat) where waiting out a token lifetime after a
  revocation is unacceptable.
- Reducing the value of a **stolen token**: a replayed token from a new location or after a
  revocation event triggers a challenge — see
  [Token Theft & Replay](../../../threat-defense/token-theft-replay/README.md).
- Any zero-trust posture that treats "issued" as "provisional, subject to re-check".

## Actors

| Actor | Role |
|---|---|
| User | Human whose session may be revoked by a critical event |
| Client | App holding the CAE-capable access token, able to handle a claims challenge |
| API | Resource server enforcing CAE; returns the claims challenge when the token no longer meets policy |
| IdP | Identity Provider that publishes critical events and re-evaluates on challenge |
| Signal sources | Admin actions, directory changes, risk engine, network-location signals that produce critical events |

## Alternate scenarios covered

- **No event → token honoured** — normal calls succeed until expiry, no extra round trips.
- **Critical event → challenge → re-issue** — a revocation event causes the next call to be
  challenged; the client silently reauthorizes and gets a fresh (or denied) token.
- **Revoked / disabled user** — re-evaluation denies; the client cannot obtain a new token.
- **Client not CAE-capable** — the API cannot rely on challenge handling and must fall back
  to short token lifetimes.

## Security notes

- **CAE shrinks, not eliminates, the window.** Enforcement is *near*-real-time; propagation
  of the critical event still takes seconds. Pair with short lifetimes for the most
  sensitive resources.
- **The claims challenge is the pivot.** The RP must return a proper
  `WWW-Authenticate` claims challenge and the client must reauthorize with it — a client
  that just retries the same token loops.
- **Location enforcement needs a source of truth.** Binding a token to an IP range only
  helps if the API sees the true client IP (beware proxies / egress NAT).
- **Combine with sender-constrained tokens.** CAE reduces *how long* a stolen token works;
  DPoP / mTLS reduce *whether* it works elsewhere at all.
- **Do not treat CAE as authorization.** It re-checks *authentication/session* validity;
  fine-grained entitlement decisions still belong to the
  [PDP/PEP](../../../authorization/policy-decision-enforcement/README.md).

## Related diagrams

- [Continuous Access Evaluation (Entra)](../../../platforms/cloud-iam/entra/continuous-access-evaluation/README.md) — the concrete vendor implementation with its event catalogue.
- [Conditional Access Evaluation (Entra)](../../../platforms/cloud-iam/entra/conditional-access-evaluation/README.md) — the policy layer CAE re-checks against.
- [Step-up Authentication](../step-up-authentication/README.md) — the same claims-challenge mechanism used to *raise* rather than *revoke* assurance.
- [Risk-Based Adaptive Authentication](../risk-based-adaptive-authentication/README.md) — the sign-in-time score CAE continuously re-applies.
- [Token Theft & Replay](../../../threat-defense/token-theft-replay/README.md) — the attack CAE is designed to blunt.
- [Refresh Token](../../oidc/refresh-token/README.md) — the reauthorization path the challenge drives.

## Files

- [sequence.md](./sequence.md) — token issuance, a critical event, the claims challenge, and re-evaluation.
- [swimlane.md](./swimlane.md) — lanes for User, Client, API, IdP, Signal sources.
- [flowchart.md](./flowchart.md) — the honour / challenge / re-issue / deny decision tree.
