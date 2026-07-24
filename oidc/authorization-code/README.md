# OIDC Authorization Code Flow (Confidential Client)

The baseline OpenID Connect flow. A confidential client (server-side web app that can keep a
secret) redirects the browser to the IdP's `/authorize` endpoint with
`response_type=code&scope=openid`, the user authenticates and consents, and the IdP returns a
short-lived, single-use authorization code via the browser. The client then redeems the code at
the `/token` endpoint over a back channel, authenticating itself with `client_secret_basic` or
`private_key_jwt`, and receives an ID token, access token, and (optionally) a refresh token.
Tokens never transit the browser.

## When it's used

- Server-rendered web applications with a backend that can hold client credentials.
- Any client that can protect a secret and make direct HTTPS calls to the token endpoint.
- The default choice per OAuth 2.0 Security BCP; public clients add PKCE
  ([authorization-code-pkce](../authorization-code-pkce/README.md)).

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating |
| Browser | User agent carrying front-channel redirects |
| Client | Confidential OIDC relying party (web app backend) |
| IdP | OpenID Provider: `/authorize`, `/token`, `/userinfo`, JWKS |
| API | Resource server accepting the access token |

## Key endpoints and parameters

- Discovery: `GET /.well-known/openid-configuration` yields endpoint URLs and `jwks_uri`.
- `/authorize`: `response_type=code`, `client_id`, `redirect_uri`, `scope=openid profile email`,
  `state` (CSRF binding), `nonce` (ID-token replay binding), optionally `prompt`, `login_hint`.
- `/token`: `grant_type=authorization_code`, `code`, `redirect_uri`, plus client authentication.
- ID token validation: signature via JWKS, `iss`, `aud` = client_id, `exp`, `nonce` match,
  `azp` when multiple audiences.

## Alternates covered in the diagrams

- Client authentication: `client_secret_basic` vs `private_key_jwt` assertion.
- `state` mismatch on the callback — treated as CSRF, response discarded.
- Authorization code replay — IdP returns `invalid_grant` and revokes tokens already issued for that code.
- Silent SSO with `prompt=none`, and the `login_required` / `interaction_required` error when no session exists.

## Security notes

- `state` must be unguessable and bound to the browser session; verify before touching the code.
- `nonce` must be validated against the value stored at request time to stop ID-token replay.
- Codes are single-use and short-lived (seconds to a couple of minutes); the IdP must detect reuse
  and revoke the derived token grant (RFC 6749 s4.1.2 / Security BCP).
- Exact-match `redirect_uri` registration; no wildcards, no open redirectors.
- `private_key_jwt` avoids shared secrets and enables key rotation — prefer it where supported.

## Diagrams

- [sequence.md](sequence.md) — happy path plus state-mismatch, code-replay, and prompt=none alternates.
- [swimlane.md](swimlane.md) — one lane per actor showing front-channel vs back-channel handoffs.
- [flowchart.md](flowchart.md) — validation decisions and error terminals.

## Related diagrams

- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — same flow for public clients.
- [Refresh Token](../refresh-token/README.md) — what happens after the access token expires.
- [Hybrid](../hybrid/README.md) — adds a front-channel ID token to this flow.
- [RP-Initiated Logout](../rp-initiated-logout/README.md) — ending the session created here.
- [SAML SP-Initiated SSO](../../saml/sp-initiated-sso/README.md) — the SAML equivalent of this pattern.
