# OIDC Implicit Flow (Legacy — Deprecated)

The original browser-app flow: the client requests `response_type=id_token token` (or just
`id_token`) and the IdP returns the tokens **directly in the URL fragment** of the redirect —
no code, no back-channel, no client authentication. It existed because pre-CORS browsers
could not call `/token` cross-origin. It is deprecated by the OAuth 2.0 Security BCP
(`response_type=token` MUST NOT be used) and OAuth 2.1 removes it entirely. Kept here as a
reference for recognizing and migrating legacy integrations.

## Why it's deprecated

- **Fragment leakage**: tokens land in the URL — browser history, proxy/referrer edge cases,
  JS-accessible `location.hash`, screen sharing, copy-pasted links.
- **No sender constraint / no client auth**: any bearer who obtains the token can use it; the
  IdP never authenticates the client, so a token issued to one app is indistinguishable in use.
- **No refresh tokens**: forced silent-iframe renewals, fragile under third-party-cookie blocking.
- **Token injection**: an access token from the fragment can be swapped by an attacker; only
  `at_hash` in the ID token partially mitigates.

**Replacement:** [Authorization Code + PKCE](../authorization-code-pkce/README.md).

## When it's (still) seen

- Legacy SPAs built before ~2019 and some old IdP sample code.
- Never for new work. Migration = switch to `response_type=code` + PKCE and rotate any
  long-lived tokens issued under implicit.

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating |
| Browser | Runs the SPA; the fragment lives here |
| Client | Public SPA relying party (JS in the browser) |
| IdP | OpenID Provider |
| API | Resource server receiving the bearer token |
| Attacker | Party reading the fragment (shown in the leakage alternate) |

## Key parameters

- `/authorize`: `response_type=id_token token`, `client_id`, `redirect_uri`,
  `scope=openid`, `state`, `nonce` (**required** for implicit — the only replay defense).
- Response (in fragment): `#id_token=...&access_token=...&token_type=Bearer&expires_in=3600&state=...`
- ID token must carry `at_hash` binding the access token when both are issued.

## Alternates covered in the diagrams

- Fragment interception: token read from history / injected script / leaked URL, then replayed
  at the API — succeeds, because bearer tokens have no sender constraint. This is the point.
- `nonce` mismatch → ID token rejected.
- Silent renewal iframe failing with `login_required` under blocked third-party cookies.

## Security notes

- If you must keep it running temporarily: shortest possible token lifetimes, `nonce` and
  `at_hash` validation enforced, strict CSP, immediately strip the fragment after parsing.
- Audit logs cannot distinguish a legitimate SPA from a token thief — plan the migration.

## Diagrams

- [sequence.md](sequence.md) — happy path plus the fragment-interception alternate.
- [swimlane.md](swimlane.md) — shows tokens transiting the Browser lane, the core flaw.
- [flowchart.md](flowchart.md) — validation branches and the leakage terminal.

## Related diagrams

- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the mandated replacement.
- [Hybrid](../hybrid/README.md) — also returns a front-channel ID token, but pairs it with a code.
- [Authorization Code](../authorization-code/README.md) — the confidential-client baseline.
- [SAML IdP-Initiated SSO](../../saml/idp-initiated-sso/README.md) — a SAML pattern with a
  comparable unsolicited-response weakness.
