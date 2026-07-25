---
title: "Front-Channel Logout"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Front-Channel Logout

**Status:** ✅ Current

## Purpose

OpenID Connect Front-Channel Logout 1.0 propagates a logout from the OpenID Provider to
every Relying Party sharing the SSO session **through the user's browser**. On its
logout page the IdP renders one hidden `<iframe>` per logged-in RP, each loading that
RP's registered `frontchannel_logout_uri` (with `iss` and `sid` query parameters when
`frontchannel_logout_session_required` is true). Each RP's logout URI handler clears
that RP's local session cookie as the frame loads.

This is the browser-based alternative to
[Back-Channel Logout](../back-channel-logout/README.md). It requires no server-to-server
connectivity, but it is **best-effort**: it depends on the browser rendering frames and
on RP cookies being readable in a third-party-iframe context.

## When it's used

- Single logout across web RPs when the IdP cannot reach RP back ends directly
  (RPs behind firewalls, no shared network path).
- Legacy RPs that can implement "a GET that clears a cookie" but not JWT validation.
- Usually triggered by an [RP-Initiated Logout](../rp-initiated-logout/README.md) or an
  IdP-side (administrative) logout.

## Actors

| Actor | Role |
|---|---|
| `User` | Human who logged out |
| `Browser` | Renders the IdP logout page and its per-RP iframes |
| `IdP` | OpenID Provider that tracks which RPs joined the session |
| `RP1`, `RP2` | Relying Parties registered with `frontchannel_logout_uri` |

## Endpoints and parameters

- RP registration metadata: `frontchannel_logout_uri`,
  `frontchannel_logout_session_required` (boolean).
- IdP discovery metadata: `frontchannel_logout_supported`,
  `frontchannel_logout_session_supported`.
- Iframe request: `GET <frontchannel_logout_uri>?iss=<issuer>&sid=<session id>` —
  `iss` and `sid` are sent together or not at all. The RP validates that `iss`/`sid`
  match a session it holds, then clears it.
- The `sid` correlates with the `sid` claim the RP received in its ID token.

## Alternates covered

- **Blocked third-party cookies** — the RP logout URI loads, but the browser refuses
  to send/clear the RP session cookie in a third-party iframe context, so the RP
  session survives: **partial logout**.
- **RP unreachable / slow** — frame fails to load or exceeds the IdP's render
  timeout; IdP cannot tell, user may navigate away early: partial logout.
- **Missing `iss`/`sid` when required** — RP ignores the request (defends against
  logout CSRF).

## Reliability caveats

Front-channel logout is inherently unreliable and should be treated as UX-grade, not
security-grade:

- Modern browsers (Safari ITP, Firefox ETP, Chrome third-party-cookie phase-out)
  partition or block cookies in cross-site iframes — the exact mechanism this flow
  depends on. Expect partial logout on current browsers.
- The IdP gets **no confirmation**: an iframe returning 200 is indistinguishable from
  one that failed CSP checks, timed out, or was never rendered because the user closed
  the tab.
- Content-Security-Policy or `X-Frame-Options` on the RP logout URI can silently block
  the frame.
- Deployments needing assurance should prefer
  [Back-Channel Logout](../back-channel-logout/README.md), or combine both plus short
  RP session lifetimes / token introspection as a backstop.

## Security notes

- The logout URI is a state-changing GET reachable by anyone; requiring and validating
  `iss` + `sid` prevents third parties from forcibly logging users out (logout CSRF).
- RPs must not perform any action beyond clearing the local session (no redirects, no
  token revocation of other users) based on this unauthenticated request.
- `frontchannel_logout_uri` must be HTTPS and pre-registered.

## Diagrams

- [Sequence diagram](./sequence.md)
- [Swimlane diagram](./swimlane.md)
- [Flowchart (decision logic)](./flowchart.md)

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Related diagrams

- [RP-Initiated Logout](../rp-initiated-logout/README.md) — the usual trigger for this propagation.
- [Back-Channel Logout](../back-channel-logout/README.md) — reliable server-to-server alternative.
- [Authorization Code](../authorization-code/README.md) — where the `sid` claim originates.
- [SAML SLO (IdP-initiated)](../../saml/slo-idp-initiated/README.md) — SAML's front-channel logout equivalent.
- [Session Cookie](../../tokenless/session-cookie/README.md) — the artifact each RP is clearing.
- [ForgeRock CDSSO](../../../platforms/platform-specific/forgerock-authentication-journey/README.md) — cross-domain session patterns with the same third-party-cookie constraints.
