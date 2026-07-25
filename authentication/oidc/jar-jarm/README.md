---
title: "JWT-Secured Authorization Request (JAR, RFC 9101) and Response Mode (JARM)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9101"
---

# JWT-Secured Authorization Request (JAR, RFC 9101) and Response Mode (JARM)

**Status:** 🔵 Emerging

## What it is

Two complementary mechanisms that wrap the authorization request and/or response in
a JWT so their parameters are integrity-protected (and optionally confidential),
rather than sent as bare query parameters an attacker or the user agent can tamper
with.

- **JAR — securing the request (RFC 9101).** Instead of listing `response_type`,
  `client_id`, `scope`, `redirect_uri`, `state`, `nonce`, etc. as individual query
  parameters, the client packs them into a signed **request object**: a JWT signed
  with the client's key (`alg` = e.g. `RS256`/`ES256`, header `typ` `oauth-authz-req+jwt`),
  containing those parameters as claims. It is delivered either **by value** in the
  `request` parameter or **by reference** in `request_uri` (the AS fetches the JWT).
  The AS verifies the signature before acting, so request parameters cannot be
  silently modified. `client_id` and `response_type` still appear as plain query
  params so the AS can route the request.
- **JARM — securing the response.** The authorization **response** parameters
  (`code`, `state`, `iss`, plus `exp`, `aud`, `iss`) are returned inside a signed
  (and optionally encrypted) JWT via `response_mode=jwt` (or the mode-specific
  `query.jwt`, `fragment.jwt`, `form_post.jwt`). The client verifies the JWT before
  trusting the `code`, defeating response tampering, code injection, and mix-up
  attacks (the `iss` claim identifies which AS answered).

Both are foundational to FAPI 2.0 and are often combined with
[Pushed Authorization Requests](../pushed-authorization-requests/README.md), which
pushes the (possibly JAR) request to the back channel entirely.

## When it is used

- FAPI / open-banking and other high-assurance profiles that require request and
  response integrity end-to-end.
- Any deployment wanting protection against request-parameter tampering, response
  code injection, and IdP mix-up attacks without relying on the browser to be honest.
- Clients that must non-repudiably prove exactly what they asked for (the signed
  request object is an auditable artifact).

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating at the IdP |
| Client | Builds and signs the request object (JAR), verifies the signed response JWT (JARM) |
| IdP | OpenID Provider: verifies the request object, returns a signed/encrypted response JWT |

## Alternate scenarios covered

- JAR by value: request object in the `request` query parameter.
- JAR by reference: `request_uri` the AS dereferences (often a PAR `request_uri`).
- JARM: `response_mode=jwt` returns `code`/`state`/`iss` inside a signed response JWT.
- Bad request-object signature or `request`/query mismatch → `invalid_request_object`.
- Tampered / wrong-issuer response JWT (`iss` mismatch, bad signature) → client rejects, mix-up thwarted.

## Security notes

- The AS MUST verify the request-object signature against the client's registered
  `jwks`/`jwks_uri` before honoring any parameter; parameters outside the JWT (other
  than routing `client_id`/`response_type`) should be ignored or must match.
- `request_uri` fetching is an SSRF surface — restrict to registered/pre-vetted URIs,
  or better, use PAR-issued one-time `request_uri` values with short lifetimes.
- JARM's `iss` claim is the primary defense against IdP **mix-up**: the client must
  check `iss` (and `aud` = client_id) on the response JWT.
- Prefer asymmetric signing (`private_key_jwt`-style keys); `alg: none` MUST be
  rejected for both request objects and JARM responses.
- Encrypt (JWE) the request object and/or JARM response when parameters are sensitive
  (e.g. RAR `authorization_details`, PII in claims requests).

## Related diagrams

- [Pushed Authorization Requests](../pushed-authorization-requests/README.md) — pushes the (JAR) request to the back channel; frequently paired with JAR/JARM.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the underlying flow JAR/JARM harden.
- [Hybrid Flow](../hybrid/README.md) — another front-channel response shape JARM can secure.
- [Rich Authorization Requests](../rich-authorization-requests/README.md) — `authorization_details` are best carried inside a signed request object.

## Files

- [sequence.md](./sequence.md) — happy path plus by-reference JAR, JARM response, and signature-failure alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Client, IdP.
- [flowchart.md](./flowchart.md) — request-object and response-JWT verification decision logic with error terminals.
