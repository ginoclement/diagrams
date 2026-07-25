---
title: "Resource Owner Password Credentials (ROPC) Grant"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: true
rfc: "RFC 6749"
---

# Resource Owner Password Credentials (ROPC) Grant

**Status:** ⛔ Deprecated

## What it is

The ROPC grant (OAuth 2.0, RFC 6749 §4.3) has the client collect the end user's
**username and password directly** and POST them to the token endpoint in exchange
for tokens. There is no browser redirect and no `/authorize` step:

```
POST /token
grant_type=password
&username=alice
&password=s3cr3t
&scope=openid profile
&client_id=... (+ client_secret if confidential)
```

The AS authenticates the credentials against its user store and returns
`access_token`, optionally `refresh_token`, and — if `openid` scope is present and
the AS supports it — an `id_token`. The client sees the raw password.

## Why deprecated

- The client (often a third party or a native app) directly handles the user's
  password, defeating the entire point of OAuth's redirect model, which is to keep
  credentials out of the client's hands.
- It is fundamentally **incompatible with modern authentication**: no MFA / step-up,
  no passkeys/WebAuthn, no risk-based or adaptive auth, no federated/social login, no
  passwordless — all of which require the interactive `/authorize` UI.
- It trains users to type their IdP password into arbitrary apps, normalizing
  phishing.
- The OAuth 2.0 Security Best Current Practice and OAuth 2.1 **remove/forbid** the
  password grant. It survives only in legacy first-party clients and migration
  scenarios.

## Use instead

- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the correct
  replacement for interactive user login on public and confidential clients; keeps
  the password on the IdP and supports MFA, passkeys, and federation.
- [Device Authorization](../device-authorization/README.md) — for input-constrained
  devices that motivated ROPC misuse.
- [Client Credentials](../client-credentials/README.md) — for machine-to-machine
  calls with no user present (a common ROPC anti-pattern).

## Actors

| Actor | Role |
|---|---|
| User | Hands username + password to the client (the anti-pattern) |
| Client | Collects credentials and POSTs `grant_type=password` to `/token` |
| IdP | Authorization server: validates credentials against the Directory, issues tokens |
| Directory | User/credential store the IdP checks |

## Alternate scenarios covered

- Happy path: valid credentials → tokens (with `id_token` if `openid` scope).
- Invalid credentials → `400 invalid_grant` (never distinguish bad-user from bad-password).
- MFA required → the grant cannot satisfy the challenge → `invalid_grant` / `interaction_required`, forcing a redirect flow.
- Account locked / password expired → `invalid_grant`, no way to remediate inline.

## Security notes

- The client necessarily sees and could log/store the password — the core reason to
  avoid this grant entirely.
- ROPC cannot carry an interactive MFA or step-up challenge; enabling it typically
  means weakening the auth policy for the users who go through it.
- If it must exist for legacy first-party apps, restrict it to a specific
  confidential client, disable refresh tokens or rotate aggressively, scope it
  minimally, and rate-limit to blunt credential-stuffing (the endpoint is an online
  password oracle).
- Plan migration to [Authorization Code + PKCE](../authorization-code-pkce/README.md)
  and remove the grant from the client's allowed `grant_types`.

## Related diagrams

- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the recommended replacement.
- [Client Credentials](../client-credentials/README.md) — the right choice when no user is actually present.
- [Device Authorization](../device-authorization/README.md) — for input-constrained devices.
- [Refresh Token](../refresh-token/README.md) — token renewal without re-collecting credentials.

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Files

- [sequence.md](./sequence.md) — happy path plus invalid-credentials, MFA-required, and locked-account alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Client, IdP, Directory.
- [flowchart.md](./flowchart.md) — credential and MFA decision logic with error terminals.
