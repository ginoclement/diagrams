# OIDC Authorization Code Flow with PKCE (Public Client)

**Status:** ✅ Current

The authorization code flow hardened with Proof Key for Code Exchange (RFC 7636) for public
clients — SPAs and native/mobile apps that cannot keep a client secret. Before redirecting to
`/authorize`, the app generates a random `code_verifier`, derives
`code_challenge = BASE64URL(SHA256(code_verifier))`, and sends the challenge with
`code_challenge_method=S256`. At `/token` it presents the original `code_verifier`; the IdP
recomputes the hash and rejects any mismatch. A stolen authorization code is useless without
the verifier, which never leaves the app.

## When it's used

- Single-page applications and native/mobile apps (custom URI schemes, app links, loopback redirects).
- Per current OAuth 2.0 Security BCP, PKCE is recommended for **all** clients, including
  confidential ones, as extra code-injection protection.
- Replaces the deprecated [implicit flow](../implicit/README.md).

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating |
| App | Public client (SPA in a browser, or a native app) acting as its own user agent front end |
| IdP | OpenID Provider: `/authorize`, `/token`, JWKS |
| API | Resource server |
| Attacker | Malicious app/party intercepting the redirect (shown only in the thwarted alternate) |

## Key parameters

- `/authorize`: everything from the base code flow plus `code_challenge` and
  `code_challenge_method=S256` (`plain` exists but is forbidden unless S256 is impossible).
- `/token`: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`,
  `code_verifier` — **no client secret**.
- `code_verifier`: 43–128 chars of high-entropy unreserved characters, stored only in app memory.

## Alternates covered in the diagrams

- Code interception attack (malicious app registered on the same custom URI scheme) — thwarted
  because the attacker lacks the `code_verifier`; IdP answers `invalid_grant`.
- `plain` vs `S256` challenge method — why `plain` is rejected/discouraged.
- Verifier mismatch (app bug, storage loss mid-flow) → `invalid_grant`.

## Security notes

- S256 only: with `plain`, an attacker who saw the `/authorize` request already has the verifier.
- The verifier must be generated fresh per authorization request and never persisted or logged.
- `state` and `nonce` are still required — PKCE stops code theft, not CSRF or ID-token replay.
- Refresh tokens for public clients should be rotated on every use — see
  [Refresh Token](../refresh-token/README.md).
- Native apps: prefer claimed HTTPS app links over custom schemes (RFC 8252) to shrink the
  interception surface in the first place.

## Diagrams

- [sequence.md](sequence.md) — happy path plus interception-thwarted, plain-method, and mismatch alternates.
- [swimlane.md](swimlane.md) — lanes for User, App, IdP, API.
- [flowchart.md](flowchart.md) — challenge/verifier decision logic with error terminals.

## Related diagrams

- [Authorization Code (confidential)](../authorization-code/README.md) — the base flow with client secrets.
- [Implicit](../implicit/README.md) — the legacy flow this replaces.
- [Refresh Token](../refresh-token/README.md) — rotation matters most for public clients.
- [Device Authorization](../device-authorization/README.md) — for clients with no browser at all.
- [WebAuthn / Passkey Authentication](../../tokenless/webauthn-passkey-authentication/README.md) — a
  common primary-auth step inside the IdP portion of this flow.
