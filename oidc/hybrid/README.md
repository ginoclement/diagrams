# OIDC Hybrid Flow (response_type=code id_token)

**Status:** ✅ Current

A combination flow: the `/authorize` response returns **both** an authorization code and an
ID token in the front channel (fragment), while the access token still comes from the
back-channel `/token` exchange. The front-channel ID token lets the client establish who the
user is immediately — before the token round trip — and, critically, carries a `c_hash` claim
(left half of the SHA-256 of the code) that cryptographically binds the code to this
authentication response, detecting code injection/substitution.

Other hybrid variants exist (`code token`, `code id_token token`) but `code id_token` is the
only widely recommended one, since it keeps access tokens off the front channel.

## When it's used

- Clients that want an authenticated session the instant the redirect lands, without waiting
  for `/token` (e.g. rendering personalized UI while the code exchange runs).
- Deployments wanting detached-signature-style protection for the code (`c_hash`) without
  full JARM/FAPI machinery; historically common in banking/FAPI 1.0 profiles.
- Mostly superseded for new builds by code + PKCE (simpler, nothing in the fragment).

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating |
| Browser | Carries the fragment response |
| Client | Confidential relying party |
| IdP | OpenID Provider |
| API | Resource server |

## Key parameters

- `/authorize`: `response_type=code id_token`, `scope=openid`, `state`, `nonce`
  (**required** — the front-channel ID token must be replay-bound), `redirect_uri`.
- Fragment response: `#code=...&id_token=...&state=...`
- Front-channel ID token claims: usual set plus `c_hash`; `nonce` mandatory.
- `/token`: standard code redemption with client authentication; returns access token and a
  **second** ID token whose `iss`/`sub` must match the first.

## Alternates covered in the diagrams

- `c_hash` mismatch — injected/substituted code detected before `/token` is ever called.
- `nonce` mismatch on the front-channel ID token.
- `iss`/`sub` mismatch between front-channel and back-channel ID tokens.

## Security notes

- Validate the front-channel ID token **fully** (signature, iss, aud, exp, nonce) *then*
  `c_hash` — an unvalidated token proves nothing about the code.
- `c_hash` = base64url(left-most half of SHA-256(ASCII code)), hash alg from the ID token `alg`.
- The ID token still transits the fragment: same history/leakage cautions as
  [implicit](../implicit/README.md), though it contains no bearer access token.
- Compare both ID tokens after `/token`: `iss` and `sub` must be identical.

## Diagrams

- [sequence.md](sequence.md) — happy path with c_hash validation, plus the mismatch alternate.
- [swimlane.md](swimlane.md) — front-channel vs back-channel lanes.
- [flowchart.md](flowchart.md) — dual ID-token validation decisions and error terminals.

## Related diagrams

- [Authorization Code](../authorization-code/README.md) — the back-channel half of this flow.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the modern default that
  makes hybrid rarely necessary.
- [Implicit](../implicit/README.md) — the front-channel-only ancestor.
- [Back-Channel Logout](../back-channel-logout/README.md) — session teardown for RPs like this one.
