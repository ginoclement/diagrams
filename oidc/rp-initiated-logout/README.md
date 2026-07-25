---
title: "RP-Initiated Logout"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RP-Initiated Logout

**Status:** ✅ Current

## Purpose

OpenID Connect RP-Initiated Logout 1.0 lets a Relying Party (Client) that wants to log
the user out do so at the OpenID Provider too, not just locally. The RP clears its own
session, then redirects the browser to the IdP's `end_session_endpoint` with
`id_token_hint` and `post_logout_redirect_uri`. The IdP terminates its SSO session
(optionally after asking the user to confirm) and redirects the browser back to the RP.

RP-initiated logout ends the session **at the IdP**. Propagating that logout to *other*
RPs that share the SSO session is a separate concern handled by
[Front-Channel Logout](../front-channel-logout/README.md) and/or
[Back-Channel Logout](../back-channel-logout/README.md) — a complete single-logout
deployment usually chains this flow into one of those.

## When it's used

- The user clicks "Log out" inside an application that received its session via OIDC SSO.
- Shared/kiosk machines where leaving the IdP session alive lets the next person
  silently SSO back in.
- Compliance regimes that require full session termination on explicit logout.

## Actors

| Actor | Role |
|---|---|
| `User` | Human clicking "Log out" |
| `Browser` | User agent carrying redirects and the IdP session cookie |
| `Client` | RP that initiates the logout |
| `IdP` | OpenID Provider hosting the `end_session_endpoint` |

## Endpoints and parameters

- `GET /end_session` (`end_session_endpoint` from discovery metadata) with:
  - `id_token_hint` — the ID token previously issued to this RP (recommended; lets
    the IdP identify the session and skip the confirmation prompt).
  - `post_logout_redirect_uri` — must exactly match a value pre-registered in the
    client's `post_logout_redirect_uris`; only honored when the RP is identified via
    `id_token_hint` or `client_id`.
  - `client_id` — optional, alternative RP identification.
  - `state` — opaque value echoed back on the post-logout redirect for CSRF-safe
    round-tripping.
  - `logout_hint` / `ui_locales` — optional UX hints.

## Alternates covered

- **Confirmation prompt** — no/invalid `id_token_hint`, so the IdP asks the user
  "Do you want to log out?" before terminating the session.
- **Invalid `post_logout_redirect_uri`** — not registered for the client; the IdP
  must NOT redirect there and instead shows its own logged-out page.
- **User cancels** at the confirmation prompt — IdP session stays alive.
- **Propagation hand-off** — IdP triggers front-/back-channel logout to other RPs
  before redirecting back (noted, drawn in the propagation diagrams).

## Security notes

- Treat the logout request as unauthenticated input: without a valid `id_token_hint`
  an attacker can craft logout links (logout CSRF / denial of service by forced
  logout). The confirmation prompt is the mitigation.
- `post_logout_redirect_uri` must be validated by **exact match** against registered
  values; otherwise the endpoint becomes an open redirector.
- The RP should destroy its local session **before** redirecting — if the user never
  returns from the IdP, the RP session must still be gone.
- Echo `state` back unmodified so the RP can correlate the return leg.
- An expired `id_token_hint` is still acceptable for identifying the session; the IdP
  validates its signature and audience, not its `exp`.

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [Front-Channel Logout](../front-channel-logout/README.md) — browser-based propagation to other RPs in the same SSO session.
- [Back-Channel Logout](../back-channel-logout/README.md) — server-to-server propagation; more reliable.
- [Authorization Code](../authorization-code/README.md) — how the session being torn down was established.
- [SAML SLO (SP-initiated)](../../saml/slo-sp-initiated/README.md) — the SAML equivalent of this flow.
- [SAML SLO (IdP-initiated)](../../saml/slo-idp-initiated/README.md) — logout starting at the IdP instead.
- [Session Cookie](../../tokenless/session-cookie/README.md) — the local sessions actually being destroyed.
