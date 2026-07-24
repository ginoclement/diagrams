# Single Logout — SP-Initiated

## Purpose

SAML 2.0 Single Logout (SLO) started at a Service Provider. The user clicks "Logout"
in one app; that SP sends a `LogoutRequest` to the IdP's SLO endpoint, the IdP
terminates its own session and **propagates** `LogoutRequest`s to every other SP that
participates in the same IdP session, collects their `LogoutResponse`s, and finally
returns a `LogoutResponse` to the initiating SP — with status `Success` or
`PartialLogout` if any participant could not be logged out.

## When it's used

- Enterprise suites where signing out of one federated app must end the whole SSO
  session (compliance, shared kiosks, high-sensitivity apps).
- Whenever leaving a live IdP session behind after an app logout is unacceptable
  (otherwise the next visit silently re-authenticates via seamless SSO).

## Actors

| Actor | Role |
|---|---|
| User | Human clicking logout at SP1 |
| Browser | Front-channel carrier for redirect/POST-based propagation |
| SP1 | Initiating Service Provider; sends the first `LogoutRequest` |
| IdP | Session authority; propagates logout to all session participants |
| SP2 | Another SP participating in the same IdP session |

## Key protocol details

- `LogoutRequest` carries the `NameID` and (if issued) the `SessionIndex` of the
  assertion being terminated; it is signed and sent to the IdP **SingleLogoutService**
  endpoint via HTTP-Redirect, HTTP-POST, or SOAP binding.
- **Front-channel propagation**: the IdP redirects (or auto-POSTs) the browser to each
  session participant's SLO endpoint in turn; each SP destroys its local session and
  returns the browser to the IdP with a `LogoutResponse`.
- **Back-channel propagation**: the IdP calls each SP's SOAP SLO endpoint directly with
  a `LogoutRequest`; no browser involvement, but the SP cannot clear browser cookies —
  it must invalidate the session server-side.
- Final `LogoutResponse` to SP1 uses status `urn:oasis:names:tc:SAML:2.0:status:Success`
  or top-level `Success` with second-level
  `urn:oasis:names:tc:SAML:2.0:status:PartialLogout` when at least one participant failed.

## Alternates covered

- Front-channel redirect chain across session-participant SPs.
- Back-channel SOAP propagation variant.
- A participant SP that is unreachable/unresponsive, producing `PartialLogout`.

## Security notes

- All `LogoutRequest`/`LogoutResponse` messages must be signed and validated —
  an unsigned logout request is a denial-of-service primitive (forced logout / CSRF logout).
- Validate `NameID` + `SessionIndex` match a real session before destroying it.
- Front-channel SLO is fragile: one SP that hangs, errors, or blocks third-party
  navigation breaks the chain; the user may believe they are logged out when they are not.
  Treat SLO as best-effort and keep SP session lifetimes short.
- Back-channel SLO cannot delete SP cookies; SPs must check server-side session state,
  not merely cookie presence.
- After logout, the IdP should render a confirmation page rather than silently
  redirecting, so the user can see partial-logout warnings.

## Diagrams

- [sequence.md](sequence.md) — LogoutRequest/LogoutResponse exchange, front- vs back-channel alt, partial logout
- [swimlane.md](swimlane.md) — lanes for User, Browser, SP1, IdP, SP2
- [flowchart.md](flowchart.md) — IdP propagation loop and status decision logic

## Related diagrams

- [IdP-initiated SLO](../slo-idp-initiated/README.md) — logout starting at the IdP portal
- [SP-initiated SSO](../sp-initiated-sso/README.md) — the session establishment this flow tears down
- [OIDC RP-initiated logout](../../oidc/rp-initiated-logout/README.md) — OIDC counterpart
- [OIDC back-channel logout](../../oidc/back-channel-logout/README.md) — OIDC's answer to SOAP SLO
- [Session cookie authentication](../../tokenless/session-cookie/README.md) — the SP sessions being destroyed
