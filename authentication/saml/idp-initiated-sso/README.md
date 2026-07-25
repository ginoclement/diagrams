---
title: "IdP-Initiated Web Browser SSO"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IdP-Initiated Web Browser SSO

**Status:** ✅ Current

## Purpose

SSO that starts at the Identity Provider: the user clicks an application tile on the
IdP portal, and the IdP sends an **unsolicited** SAML `Response` (no preceding
`AuthnRequest`, therefore **no `InResponseTo`**) to the SP's ACS URL via the HTTP-POST
binding. `RelayState` optionally carries a **deep-link target** inside the SP so the
user lands on a specific page rather than the SP home page.

## When it's used

- Corporate app-launcher portals (Okta dashboard, Entra ID My Apps, ADFS IdP-initiated
  sign-on page) where users navigate from a catalog of tiles.
- Legacy SPs that were onboarded before deep-linking/SP-initiated flows were configured.

## Actors

| Actor | Role |
|---|---|
| User | Human clicking an app tile on the IdP portal |
| Browser | User agent carrying the unsolicited POST |
| IdP | Identity Provider portal; builds the unsolicited `Response` |
| SP | Service Provider; must decide whether to accept a response with no `InResponseTo` |

## Key protocol details

- The `Response` contains **no `InResponseTo` attribute** — the SP has no pending
  request ID to correlate against. Per the spec, if `InResponseTo` is absent the SP may
  accept the response only if it is configured to allow unsolicited responses.
- `RelayState` is chosen by the IdP (often configured per app tile) and interpreted by
  the SP as the post-login landing URL — it must be validated, not blindly followed.
- All other assertion checks still apply: signature, `Issuer`, `Destination`,
  `Audience`, `NotBefore`/`NotOnOrAfter`, one-time use of the assertion ID.

## Alternates covered

- SP configured to reject unsolicited responses (policy: SP-initiated only).
- Replay detection — the same unsolicited `Response`/assertion ID posted twice.

## Security notes

- **CSRF-like risk**: because there is no `InResponseTo`, any party who can obtain a
  valid response (or trick a victim's browser into posting one) can log a browser into
  the SP without the user having asked — this is effectively a login-CSRF primitive.
  An attacker can also start a session **as the attacker** in the victim's browser
  (session fixation style) to capture data the victim later enters.
- Replay window: without request correlation, the *only* replay defenses are the short
  assertion validity window and the one-time-use assertion ID cache — both must be enforced.
- Deep-link `RelayState` is attacker-influencable in some portals; SPs must allow-list it.
- **Prefer [SP-initiated SSO](../sp-initiated-sso/README.md)**: it restores
  `InResponseTo` correlation, defeats unsolicited-response injection, and gives the SP
  control of `ForceAuthn` and requested authentication context. Many SPs support deep
  links that trigger SP-initiated SSO, which provides the same UX as an IdP tile.

## Diagrams

- [sequence.md](./sequence.md) — unsolicited Response flow with rejection and replay alternates
- [swimlane.md](./swimlane.md) — lanes for User, Browser, IdP, SP
- [flowchart.md](./flowchart.md) — SP acceptance policy and validation branches

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Related diagrams

- [SP-initiated SSO](../sp-initiated-sso/README.md) — the preferred pattern, with `InResponseTo`
- [IdP-initiated Single Logout](../slo-idp-initiated/README.md) — the logout counterpart starting at the IdP portal
- [HTTP-Artifact binding](../artifact-binding/README.md) — alternative delivery of the same response
- [OIDC Authorization Code](../../oidc/authorization-code/README.md) — OIDC has no unsolicited equivalent; state/nonce play the `InResponseTo` role
