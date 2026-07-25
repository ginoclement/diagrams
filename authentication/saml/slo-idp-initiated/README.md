---
title: "Single Logout — IdP-Initiated"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Single Logout — IdP-Initiated

**Status:** ✅ Current

## Purpose

SAML 2.0 Single Logout started **at the Identity Provider**: the user clicks "Sign out"
on the IdP portal (or an admin revokes the session). The IdP terminates its own session
and sends a `LogoutRequest` to **every** SP participating in the session — via
front-channel (redirect chain or parallel hidden iframes) or back-channel SOAP — then
shows the user a completion page that reports full or partial logout.

## When it's used

- Corporate portals (Okta dashboard, Entra ID My Apps) where "Sign out" must end all
  app sessions launched from the portal.
- Administrative/session-revocation flows (helpdesk terminates a user's SSO session).
- Shared-workstation environments where a portal-level logout is the user's habit.

## Actors

| Actor | Role |
|---|---|
| User | Human signing out at the IdP portal |
| Browser | Front-channel carrier; loads redirects or hidden iframes per SP |
| IdP | Session authority; initiates and fans out `LogoutRequest`s |
| SP1, SP2 | Session-participant Service Providers receiving logout |

## Key protocol details

- Unlike [SP-initiated SLO](../slo-sp-initiated/README.md) there is no initiating
  `LogoutRequest` from an SP and no final `LogoutResponse` back to one — the IdP is
  both the trigger and the aggregator of results.
- Each propagated `LogoutRequest` is signed and carries the `NameID` and per-SP
  `SessionIndex` values issued during SSO.
- **Front-channel variants**: a sequential redirect chain (SP responds with
  `LogoutResponse` redirect back to the IdP), or parallel **hidden iframes** where each
  frame loads the SP's SLO endpoint — faster, but responses may be lost if frames are
  blocked (third-party cookie/frame restrictions).
- **Back-channel SOAP**: the IdP calls each SP's SOAP SLO endpoint server-to-server;
  reliable delivery, but SP browser cookies cannot be cleared.
- Final state is reported on the IdP's own logout page: complete, or partial with a
  list of SPs that could not confirm logout (`PartialLogout` semantics).

## Alternates covered

- Front-channel iframe fan-out vs sequential redirect chain vs back-channel SOAP.
- A participant SP failing/timing out, yielding a partial-logout result page.

## Security notes

- Signed requests only: SPs must reject unsigned `LogoutRequest`s to prevent forced
  logout by third parties.
- Iframe-based front-channel SLO increasingly fails silently as browsers isolate
  third-party contexts (blocked cookies mean the SP cannot see which session to kill).
  Prefer back-channel SOAP with server-side session lookup where possible.
- The IdP must kill its own session *first*; otherwise a failure mid-fan-out leaves
  seamless SSO able to resurrect every SP session.
- Always show the user an explicit result page; silent partial logout is the worst
  outcome (user believes they are signed out of apps that remain live).

## Diagrams

- [sequence.md](./sequence.md) — IdP fan-out with front-channel and back-channel alternates
- [swimlane.md](./swimlane.md) — lanes for User, Browser, IdP, SP1, SP2
- [flowchart.md](./flowchart.md) — propagation loop, per-SP binding choice, partial-logout aggregation

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Related diagrams

- [SP-initiated SLO](../slo-sp-initiated/README.md) — same propagation core, different trigger and final response
- [IdP-initiated SSO](../idp-initiated-sso/README.md) — the portal-launched login counterpart
- [OIDC front-channel logout](../../oidc/front-channel-logout/README.md) — OIDC's iframe equivalent
- [OIDC back-channel logout](../../oidc/back-channel-logout/README.md) — OIDC's SOAP-less server-to-server equivalent
