---
title: "Rich Authorization Requests (RAR, RFC 9396)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9396"
---

# Rich Authorization Requests (RAR, RFC 9396)

**Status:** 🔵 Emerging

## What it is

RAR replaces (or augments) coarse, string-based `scope` values with a structured
`authorization_details` parameter: a JSON array of objects, each describing one
fine-grained authorization the client is requesting. Every object has a `type`
(a string naming an AS-defined schema) and then type-specific members drawn from a
common vocabulary defined by RFC 9396:

- `type` — required identifier for the detail schema (e.g. `payment_initiation`,
  `account_information`).
- `locations` — array of resource server URIs the authorization applies to.
- `actions` — array of actions permitted (e.g. `read`, `initiate`).
- `datatypes`, `identifier`, `privileges` — further schema-specific constraints.

The client sends `authorization_details` at `/authorize` (best carried inside a
signed request object — see [JAR/JARM](../jar-jarm/README.md) — or pushed via
[PAR](../pushed-authorization-requests/README.md), since the payload is large and
sensitive). The AS renders consent for the exact detail, and the granted
`authorization_details` are echoed back in the token response and made available to
the resource server (in a JWT access token claim, or via
[introspection](../token-introspection/README.md)). The AS advertises supported
types in metadata via `authorization_details_types_supported`.

This lets a single request say "initiate a payment of 123.45 EUR from account X to
account Y" rather than a blunt `scope=payments`.

## When it is used

- Open banking / FAPI payment initiation, where the authorization must bind to
  specific transaction parameters (amount, creditor, account).
- Any API needing per-resource, per-action, or per-object authorization too granular
  to encode as scope strings.
- Consent that must be legally precise and auditable (the user approves exact terms).

## Actors

| Actor | Role |
|---|---|
| User | Human who reviews and consents to the fine-grained authorization details |
| Client | Requests specific `authorization_details`, receives the granted set in the token response |
| IdP | OpenID Provider: validates detail objects, renders consent, issues tokens carrying granted details |
| API | Resource server that enforces the granted `authorization_details` per request |

## Alternate scenarios covered

- Happy path: `authorization_details` requested, user consents, granted details echoed in the token response and enforced by the API.
- Partial grant / downscoping: AS/user approves a subset; the token's `authorization_details` differ from the request and the client must read them back.
- Mixing `scope` and `authorization_details` in one request.
- Unknown or malformed `type` → `invalid_authorization_details`.
- API receives a request outside the granted `locations`/`actions` → `403 insufficient authorization`.

## Security notes

- `authorization_details` often carries sensitive, high-integrity data (payment
  amounts, account IDs); protect it in transit with a signed request object and/or
  PAR so it cannot be tampered with in the front channel.
- The AS MUST validate each object against its registered `type` schema and reject
  unknown types rather than silently ignoring them.
- Consent must reflect what is actually granted; the granted `authorization_details`
  returned to the client and resource server are authoritative, not the request.
- Resource servers enforce `locations`/`actions`/schema constraints per call — a token
  valid for one detail must not be honored for another resource.
- Because the granted set can be narrower than requested, clients MUST read
  `authorization_details` from the token response and not assume the request was
  granted verbatim.

## Related diagrams

- [Pushed Authorization Requests](../pushed-authorization-requests/README.md) — the preferred channel for large/sensitive `authorization_details`.
- [JAR / JARM](../jar-jarm/README.md) — signing the request object that carries the details.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the base flow RAR enriches.
- [Token Introspection](../token-introspection/README.md) — how a resource server reads granted details for opaque tokens.
- [Token Exchange](../token-exchange/README.md) — downscoping granted details when delegating.

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Files

- [sequence.md](./sequence.md) — happy path plus partial-grant, scope-mixing, and invalid-details alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Client, IdP, API.
- [flowchart.md](./flowchart.md) — detail-validation, consent, and enforcement decision logic with error terminals.
