# Back-Channel Logout

## Purpose

OpenID Connect Back-Channel Logout 1.0 propagates a logout from the OpenID Provider to
Relying Parties **server-to-server**, with no browser involvement. For each RP that
joined the terminated SSO session, the IdP POSTs a **logout token** — a short-lived JWT
containing an `events` claim
(`http://schemas.openid.net/event/backchannel-logout`) and `sub` and/or `sid` — to the
RP's registered `backchannel_logout_uri`. The RP validates the logout token like an ID
token (minus nonce), locates the matching session(s), and destroys them.

Because it does not depend on iframes or third-party cookies, back-channel logout is
the **reliable** propagation mechanism, at the cost of requiring RPs to accept inbound
HTTPS and to be able to terminate sessions from outside a browser request context.

## When it's used

- Single logout where completeness matters (finance, healthcare, admin consoles).
- Session revocation triggered without any browser: admin "kill sessions", account
  compromise response, password reset, [leaver deprovisioning](../../lifecycle/leaver/README.md).
- Environments where browser third-party-cookie restrictions break
  [Front-Channel Logout](../front-channel-logout/README.md).

## Actors

| Actor | Role |
|---|---|
| `User` | Human whose SSO session ends (may not be present, e.g. admin revocation) |
| `IdP` | OpenID Provider issuing logout tokens |
| `RP1`, `RP2` | Relying Parties registered with `backchannel_logout_uri` |

## Endpoints and parameters

- RP registration metadata: `backchannel_logout_uri`,
  `backchannel_logout_session_required`.
- IdP discovery metadata: `backchannel_logout_supported`,
  `backchannel_logout_session_supported`.
- Delivery: `POST <backchannel_logout_uri>` with
  `Content-Type: application/x-www-form-urlencoded`, body `logout_token=<JWT>`.
- RP responses: `200 OK` (logged out), `400 Bad Request` (invalid logout token),
  `504` or other 5xx (temporary failure — IdP may retry).

## Logout token validation (RP side)

1. Verify JWT signature against IdP keys (`jwks_uri`), and `alg` is an allowed value
   (not `none`; RS256 or as negotiated).
2. Validate `iss` (expected issuer), `aud` (contains this `client_id`), `iat`
   (recent), and `exp`.
3. Require the `events` claim to contain
   `http://schemas.openid.net/event/backchannel-logout`.
4. Require `sub` and/or `sid`; if `backchannel_logout_session_required`, require `sid`.
5. Reject if a `nonce` claim is present (guards against replaying an ID token as a
   logout token).
6. Optionally check `jti` against a replay cache.
7. Locate session(s) by `sid` (that one session) or `sub` (all of that user's
   sessions) and destroy them; also revoke associated refresh tokens.

## Alternates covered

- **RP endpoint down** — connection refused / 5xx; IdP queues and retries with
  backoff; sessions at that RP survive until retry succeeds or they expire.
- **Invalid logout token** — bad signature, wrong `aud`, missing `events`, or
  `nonce` present: RP responds `400` and keeps its sessions (rejecting is correct).
- **`sid` unknown at RP** — session already gone or never existed; RP returns 200
  (idempotent) or 400 per local policy.

## Security notes

- The `backchannel_logout_uri` is an unauthenticated-by-transport endpoint; the JWT
  **is** the authentication. Full validation (signature, `iss`, `aud`, `events`,
  no-`nonce`) is what prevents forged logout requests (denial of service via forced
  logout).
- Use `jti` replay caching within the token's validity window.
- Delivery is at-least-once from the IdP's perspective — RP handlers must be
  idempotent.
- A logout token with `sub` but no `sid` logs the user out of **all** their sessions
  at that RP; make sure that is the intended blast radius.
- Back-channel logout clears the RP's session, but access tokens already issued stay
  valid until expiry unless the RP/API also uses revocation or introspection — keep
  access tokens short-lived.
- RPs behind NAT/firewalls need an ingress path for the IdP's POSTs; this is the main
  deployment obstacle relative to front-channel.

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [RP-Initiated Logout](../rp-initiated-logout/README.md) — the browser-visible flow that typically triggers this propagation.
- [Front-Channel Logout](../front-channel-logout/README.md) — best-effort browser-based alternative.
- [Refresh Token](../refresh-token/README.md) — refresh tokens should be revoked alongside the session.
- [Authorization Code](../authorization-code/README.md) — where `sid`/`sub` were originally issued.
- [SAML SLO (IdP-initiated)](../../saml/slo-idp-initiated/README.md) — SAML's logout propagation, including its SOAP back-channel binding.
- [Leaver](../../lifecycle/leaver/README.md) — deprovisioning scenario that fires back-channel logout at scale.
