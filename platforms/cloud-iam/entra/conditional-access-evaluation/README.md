---
title: "Conditional Access Policy Evaluation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Conditional Access Policy Evaluation

**Status:** ✅ Current

## What it is

Conditional Access (CA) is Microsoft Entra ID's policy engine. At the moment a token is
about to be issued, the Entra authorization endpoint evaluates every enabled CA policy
against the **signals** of the request — the user/group, the target cloud app, the client
app type, sign-in and user risk (from Identity Protection), device state (compliant /
Entra-joined via the device platform), network location (named locations, trusted IPs),
and authentication context. Each policy that matches produces **grant controls** (block,
require MFA, require a compliant device, require an approved client app, require terms of
use, require password change) and **session controls** (sign-in frequency, persistent
browser, app-enforced restrictions, Continuous Access Evaluation). The union of all
matching policies must be satisfied before a token is minted.

## When it is used

- Every interactive and non-interactive token issuance in Entra where CA policies exist,
  including OIDC/OAuth `/authorize`, token refresh, and (with CAE) mid-session
  re-evaluation.
- Enforcing Zero Trust access — "verify explicitly" — on Microsoft 365, Azure, and any
  app federated to Entra as an OIDC/SAML relying party.

## Actors

| Actor | Role |
|---|---|
| User | Human requesting access to a cloud app |
| Browser | User agent / native App carrying the sign-in and any interrupt (MFA, device check) |
| Entra | Entra ID authorization endpoint and the CA policy evaluation engine |
| IdProtection | Identity Protection risk engine supplying sign-in and user risk levels |
| Device | Endpoint whose compliance/join state is a signal (via Intune / device registration) |
| App | Target cloud app (relying party) that receives the issued token |

## Alternate scenarios covered

- Grant with **require MFA** — user is challenged for a second factor mid-flow.
- **Require compliant / Entra hybrid-joined device** — blocks tokens from unmanaged
  endpoints.
- **Block** control (e.g. legacy authentication, untrusted country) — no token issued.
- **Elevated risk** routes to require MFA + secure password change, or block.
- **Report-only** policies evaluate and log but do not enforce.
- Filters for devices and authentication context step-up on sensitive actions.

## Security notes

- CA is fail-closed for block policies but only evaluates signals it has — enforce
  device compliance and disable legacy authentication
  so password-only protocols cannot bypass MFA policies.
- Combine with [Continuous Access Evaluation](../continuous-access-evaluation/README.md)
  so revocation is near-real-time instead of waiting for token expiry.
- Always keep a break-glass (emergency-access) account excluded from CA to avoid tenant
  lock-out; monitor its use.
- Report-only mode plus the What-If tool should validate a policy before it is enforced.
- Location signals depend on source IP and can be spoofed; prefer device compliance and
  phishing-resistant MFA over IP allow-lists.

## Related diagrams

- [Continuous Access Evaluation](../continuous-access-evaluation/README.md) — revoking already-issued tokens
- [Primary Refresh Token](../primary-refresh-token/README.md) — the device-bound token whose claims feed device signals
- [Device Join and Registration](../device-join-registration/README.md) — where the compliant/joined device state comes from
- [Windows Hello for Business](../windows-hello-for-business/README.md) — a phishing-resistant factor CA can require
- [Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md) — the underlying OIDC flow CA gates
- Adaptive / risk-based access — the broader risk-signal pattern

## Files

- [sequence.md](./sequence.md) — token issuance with CA evaluation and MFA / device interrupts
- [swimlane.md](./swimlane.md) — lanes for User, Browser, Entra, Identity Protection, Device, App
- [flowchart.md](./flowchart.md) — signal-by-signal grant/block decision tree
