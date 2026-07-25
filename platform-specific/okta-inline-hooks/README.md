---
title: "Okta Inline Hooks — Synchronous External Callouts"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Okta Inline Hooks — Synchronous External Callouts

**Status:** ✅ Current

**Inline hooks** let Okta pause a flow mid-execution, make a **synchronous HTTPS
callout** to an external service you own, and apply **commands** returned in the
response before continuing. Because the call is *inline* (blocking, within a request
timeout), the external service can shape the outcome: add or override token claims,
approve or deny a registration, transform a SAML assertion, or verify a legacy
password. Okta authenticates the callout with a configured header/secret; your
endpoint replies with a `commands` array (and optionally `error`).

This diagram models the four inline hook types as one pattern:

- **Registration inline hook** — on self-service registration, allow/deny and
  transform profile attributes.
- **Token inline hook** — customize `access_token` / `id_token` claims at issuance.
- **SAML assertion inline hook** — modify attribute statements before the assertion
  is signed.
- **Password import inline hook** — verify a password against a legacy store on first
  sign-in, so users migrate without a reset.

## What makes this Okta-specific (vs the generic flow)

The token or assertion is still issued by the standard
[OIDC](../../oidc/authorization-code/README.md) /
[SAML](../../saml/sp-initiated-sso/README.md) machinery — not re-drawn here. What is
Okta-specific is the **inline hook contract**: a blocking mid-flow callout that
returns a typed **`commands`** array (`com.okta.identity.patch`,
`com.okta.access.patch`, `com.okta.assertion.patch`,
`com.okta.action.update` with `credential: VERIFIED/UNVERIFIED`), plus Okta's
**fail-open vs fail-close** behavior on timeout.

## When it is used

- Injecting dynamic, externally sourced claims into tokens at issuance.
- Enforcing custom registration approval / attribute normalization.
- Migrating users from a legacy password store lazily (password import).
- Enriching or filtering SAML attribute statements for a specific SP.

## Actors

| Actor | Role |
|---|---|
| User | Triggers the flow (registers, signs in, requests a token) |
| App | OIDC client / SAML SP receiving the token or assertion |
| Okta | Okta org: pauses the flow, calls the hook, applies returned commands |
| Hook Service | External HTTPS endpoint you operate; returns `commands` / `error` |

## Alternate scenarios covered

- **Hook timeout / failure** — the external service is slow or errors; Okta applies
  its configured fallback (proceed unmodified vs abort) within the timeout window.
- **Hook returns error / deny** — the service returns an `error` object (or a deny
  command), and Okta halts the flow with a user-facing failure.

## Related diagrams

- [OIDC Authorization Code Flow](../../oidc/authorization-code/README.md) — where the token inline hook fires at issuance.
- [SAML SP-Initiated SSO](../../saml/sp-initiated-sso/README.md) — where the SAML assertion inline hook fires before signing.
- [Okta Identity Engine Sign-In](../okta-identity-engine-signin/README.md) — the sign-in pipeline hooks extend.
- [SCIM Provisioning](../../user-lifecycle/scim-provisioning/README.md) — parallel outbound integration pattern (push vs synchronous callout).

## Files

- [sequence.md](sequence.md) — flow pauses, callout, `commands` applied, resume; timeout and deny alts.
- [swimlane.md](swimlane.md) — lanes for User, App, Okta, Hook Service.
- [flowchart.md](flowchart.md) — hook response handling with timeout / error terminals.
