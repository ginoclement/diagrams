# OAuth 2.0 Client Credentials Grant (Machine-to-Machine)

**Status:** ✅ Current

A machine-to-machine grant with **no user involved**. The client authenticates as *itself*
to the `/token` endpoint (`grant_type=client_credentials`) and receives an access token
representing the client's own authorization — typically for a batch job, microservice,
daemon, or backend integration calling an API. There is no ID token (no user to identify),
no consent screen, and refresh tokens are not issued — the client simply requests a new
access token when needed.

Strictly OAuth 2.0 rather than OIDC, but it lives on the same authorization server and
endpoints, so it's indexed here with the OIDC flows.

## When it's used

- Service-to-service API calls inside or across trust boundaries.
- Scheduled jobs, CI pipelines, integration middleware.
- Anywhere the "identity" is a workload, not a person. (For user-delegated access, use
  [authorization-code](../authorization-code/README.md).)

## Actors

| Actor | Role |
|---|---|
| Client | Confidential workload (service, daemon, job) |
| IdP | Authorization server: `/token`, `/.well-known/openid-configuration`, JWKS |
| API | Resource server validating the access token |

## Key parameters

- `/token`: `grant_type=client_credentials`, optional `scope=read:reports write:jobs`
  (or an `audience`/`resource` parameter on some ASes).
- Client authentication options (shown as alternates):
  - `client_secret_basic` — HTTP Basic header (baseline).
  - `private_key_jwt` — signed JWT assertion (`client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`); no shared secret.
  - mTLS (RFC 8705) — TLS client certificate; can also **certificate-bind** the token (`cnf.x5t#S256`).
- Response: `access_token`, `token_type=Bearer`, `expires_in`, granted `scope` (may be
  narrower than requested).
- Errors: `invalid_client` (bad credentials), `invalid_scope`, `unauthorized_client`.

## Alternates covered in the diagrams

- The three client-authentication mechanisms above.
- Scope down-negotiation (AS grants a subset of requested scopes).
- API returns `401 invalid_token` on an expired token → client fetches a fresh token and retries once.
- `invalid_client` and `invalid_scope` error paths.

## Security notes

- Prefer `private_key_jwt` or mTLS over shared secrets; rotate whatever credential is used.
- Scope tokens to the minimum needed and set short lifetimes — there is no user session to
  revoke, only the credential.
- Cache tokens until near expiry; do not request a token per API call (rate limits, AS load).
- With mTLS-bound tokens the API must verify the certificate thumbprint in `cnf` — a stolen
  bearer token alone stops working.
- Retry-on-401 must be bounded (once) to avoid loops when the credential itself is revoked.

## Diagrams

- [sequence.md](sequence.md) — happy path plus auth-method alternates and 401-retry.
- [swimlane.md](swimlane.md) — Client, IdP, API lanes (no User lane — that's the point).
- [flowchart.md](flowchart.md) — token caching, error handling, and retry decisions.

## Related diagrams

- [Authorization Code](../authorization-code/README.md) — when a user's delegation is needed instead.
- [Refresh Token](../refresh-token/README.md) — how *user* flows renew tokens; M2M just re-requests.
- [Device Authorization](../device-authorization/README.md) — machines that *do* need a human approval.
- [Mutual TLS](../../tokenless/mutual-tls/README.md) — the transport-level pattern behind the mTLS alternate.
- [CIBA](../ciba/README.md) — decoupled user approval initiated by a client.
