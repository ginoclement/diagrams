# OAuth 2.0 Dynamic Client Registration (RFC 7591 / RFC 7592)

**Status:** ✅ Current

## What it is

Dynamic Client Registration lets a client register itself with an authorization
server at runtime instead of being provisioned by hand in an admin console.

- **RFC 7591 — registration.** The client POSTs a JSON `client_metadata` document
  (`redirect_uris`, `client_name`, `grant_types`, `response_types`,
  `token_endpoint_auth_method`, `scope`, `jwks`/`jwks_uri`, `contacts`,
  `logo_uri`, etc.) to the AS `registration_endpoint`. The AS responds `201 Created`
  with the assigned `client_id`, optionally a `client_secret` (with
  `client_secret_expires_at`), `client_id_issued_at`, and — for lifecycle management —
  a `registration_access_token` plus a `registration_client_uri`.
- **RFC 7592 — management.** Using that `registration_access_token` as a bearer
  credential against the per-client `registration_client_uri`, the client can `GET`
  (read current config), `PUT` (update metadata), or `DELETE` (deregister) itself.
- **Software statement.** Registration requests may carry a `software_statement`: a
  signed JWT of asserted metadata issued by a trusted party. Its claims take
  precedence over the plain JSON, letting the AS trust attributes (like allowed
  `redirect_uris` or a `software_id`) without a manual review.

Registration may be **open** (anyone can register) or **protected** (the request
itself needs an initial access token / software statement), advertised via the AS
metadata field `registration_endpoint`.

## When it is used

- Multi-tenant SaaS and API platforms onboarding many client apps programmatically.
- Ecosystems with a central trust authority that issues software statements (e.g.
  open-banking directories) so clients self-register with pre-vetted metadata.
- Dynamic OpenID Connect federations where relying parties come and go.
- CI/CD or IoT fleets that provision client credentials on first boot.

## Actors

| Actor | Role |
|---|---|
| Client | The application registering itself and later managing its own record |
| IdP | Authorization server exposing `registration_endpoint` and per-client `registration_client_uri` |
| Directory | Trust authority / software-statement issuer that signs asserted metadata (protected registration only) |

## Alternate scenarios covered

- Open registration: POST metadata → `201` with `client_id` (+ optional secret) and a `registration_access_token`.
- Protected registration: request must carry an initial access token or a signed `software_statement`.
- Lifecycle management (RFC 7592): read (`GET`), update (`PUT`), and delete (`DELETE`) via `registration_client_uri`.
- Invalid metadata (bad `redirect_uris`, unsupported `grant_types`) → `400 invalid_client_metadata` / `invalid_redirect_uri`.
- Stolen or expired `registration_access_token` → `401`, request rejected.

## Security notes

- Open registration is a spam/abuse surface: rate-limit it, constrain grantable
  scopes and `grant_types`, and prefer protected registration (initial access token
  or software statement) for anything sensitive.
- The `registration_access_token` is a long-lived, high-value credential — it can
  rewrite `redirect_uris`. Store it like a secret; rotate it on `PUT` if the AS
  returns a new one; revoke on compromise.
- Validate `redirect_uris` strictly at registration time (exact match, no open
  redirectors) — DCR is a common vector for redirect-URI injection.
- A `software_statement` must be signature-verified against the trusted issuer's keys
  before its claims override client-supplied metadata.
- Issued `client_secret` values can expire (`client_secret_expires_at`); clients must
  handle rotation, ideally moving to asymmetric auth (`private_key_jwt` / mTLS).

## Related diagrams

- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — the flow a newly registered public client then runs.
- [Client Credentials](../client-credentials/README.md) — the grant a registered confidential client uses machine-to-machine.
- [mTLS-Bound Tokens](../mtls-bound-tokens/README.md) — clients can register a cert-based `token_endpoint_auth_method`.
- [Pushed Authorization Requests](../pushed-authorization-requests/README.md) — a capability the registered client may then use.

## Files

- [sequence.md](sequence.md) — happy path plus protected/software-statement, management, and error alternates.
- [swimlane.md](swimlane.md) — lanes for Client, IdP, Directory.
- [flowchart.md](flowchart.md) — registration-authorization and metadata-validation decision logic with error terminals.
