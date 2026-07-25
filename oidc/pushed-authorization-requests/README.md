# Pushed Authorization Requests (PAR, RFC 9126)

**Status:** 🔵 Emerging

## What it is

PAR moves the authorization request off the front channel. Instead of building a
long, tamper-exposed `/authorize` URL, the client first POSTs all authorization
parameters directly to the AS's pushed-authorization-request endpoint
(`POST /par`) over an authenticated back channel. The AS validates them, stores
them, and returns a `request_uri` (e.g. `urn:ietf:params:oauth:request_uri:...`)
plus an `expires_in`. The client then sends the user to
`/authorize?client_id=...&request_uri=...` — a short, integrity-protected reference.

Because the request never travels through the browser as query parameters, it
cannot be inspected, tampered with, or bloated by URL-length limits, and the AS
can require PAR to reject any non-pushed request. PAR is a building block of the
FAPI 2.0 security profile and pairs naturally with
[JAR/JARM](../jar-jarm/README.md), [PKCE](../authorization-code-pkce/README.md),
and [RAR](../rich-authorization-requests/README.md).

## When it is used

- High-assurance profiles (FAPI 2.0, open banking, health) mandating PAR.
- Requests too large for a URL (extensive `authorization_details`/RAR, many scopes).
- Any deployment hardening against front-channel request tampering and leakage.

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating at the AS |
| Client | Pushes the request, then redirects the browser with `request_uri` |
| Browser | Carries only the short `request_uri` reference to `/authorize` |
| IdP | AS exposing `/par` and `/authorize`, honoring stored requests |

## Alternate scenarios covered

- Happy path: push → `request_uri` → `/authorize` → code → `/token`.
- `request_uri` expired or already used → `/authorize` returns `invalid_request_uri`.
- Client tries a plain (non-pushed) `/authorize` when the AS requires PAR → rejected.
- PAR combined with a signed request object (JAR) pushed as `request`.
- Client authentication failure at `/par` → `401 invalid_client`.

## Security notes

- The `request_uri` is single-use and short-lived; the AS MUST reject reuse and expiry.
- `/par` requires client authentication, so the request is bound to a known client
  before the user ever sees a redirect.
- Parameters in the pushed request are authoritative; the AS MUST ignore conflicting
  query parameters at `/authorize` (only `client_id` and `request_uri` are honored).
- Set `require_pushed_authorization_requests=true` to close the front-channel path entirely.
- PAR still needs PKCE and `state`/`nonce` — it protects request delivery, not the
  code-injection and CSRF surfaces those cover.

## Related diagrams

- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the base flow PAR front-ends.
- [JAR / JARM](../jar-jarm/README.md) — signed request objects often pushed via PAR.
- [Rich Authorization Requests](../rich-authorization-requests/README.md) — large authorization_details that motivate PAR.
- [DPoP](../dpop/README.md) — sender-constraining, another FAPI 2.0 building block.
- [mTLS-Bound Tokens](../mtls-bound-tokens/README.md) — the mTLS alternative for FAPI-grade binding.

## Files

- [sequence.md](sequence.md) — push, redirect, redeem; plus expiry, non-PAR-rejection, and JAR alternates.
- [swimlane.md](swimlane.md) — lanes for User, Client, Browser, IdP.
- [flowchart.md](flowchart.md) — request_uri validity and require-PAR policy decisions.
