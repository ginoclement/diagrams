# Session Cookie Authentication

Classic form-based login that establishes a **server-side session**. The browser never
holds a self-contained token — only an opaque session identifier delivered in a cookie
(`Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax`). All authentication state lives
in the server's session store; the cookie is merely a reference to it.

## When it's used

- Traditional server-rendered web applications (monoliths, CMSes, admin panels).
- As the *final* step of many federated flows: after SAML/OIDC completes, the SP/RP
  typically drops a local session cookie exactly like this.
- Anywhere revocation must be instant — deleting the server-side session record kills
  access immediately, unlike a bearer JWT that stays valid until expiry.

## Actors

| Actor | Role |
|---|---|
| User | Human entering credentials |
| Browser | Holds the session cookie, enforces cookie attributes |
| Server | Web application: validates credentials, manages sessions, enforces CSRF |
| Directory | User store where credentials are verified (DB, LDAP) |
| SessionStore | Server-side session state (memory, Redis, DB) |

## Alternate scenarios covered

- **Invalid credentials with lockout counter** — failed attempts increment a counter;
  the account is temporarily locked after the threshold.
- **Expired / idle session re-authentication** — request with a stale or evicted
  session ID is redirected back to login.
- **CSRF token check** — state-changing requests must carry an anti-CSRF token that
  matches the value bound to the session; mismatch is rejected.

## Security notes

- **Rotate the session ID at login** (and at privilege changes) to prevent
  **session fixation**: an attacker who planted a pre-login session ID must not find
  it still valid after the victim authenticates.
- Cookie attributes: `HttpOnly` (no JavaScript access, blunts XSS theft), `Secure`
  (HTTPS only), `SameSite=Lax` or `Strict` (limits cross-site sending, first line of
  CSRF defense). `SameSite` alone is not sufficient — keep a synchronizer or
  double-submit CSRF token for state-changing requests.
- Use long, random session IDs (>= 128 bits of entropy) and compare them in constant time.
- Enforce both an **idle timeout** and an **absolute lifetime**; destroy the
  server-side record on logout, not just the cookie.
- Rate-limit and lock out failed logins, but respond uniformly to avoid username
  enumeration.

## Diagrams

- [sequence.md](sequence.md) — login, session issuance, authenticated request, and alt paths.
- [swimlane.md](swimlane.md) — lanes for User, Browser, Server, Directory, SessionStore.
- [flowchart.md](flowchart.md) — decision logic: credential check, lockout, session validation, CSRF.

## Related diagrams

- [http-basic-auth](../http-basic-auth/README.md) — credentials on every request instead of a session.
- [magic-link](../magic-link/README.md) — passwordless way to establish the same kind of session.
- [webauthn-passkey-authentication](../webauthn-passkey-authentication/README.md) — phishing-resistant login that also ends in a session cookie.
- [OIDC authorization code](../../oidc/authorization-code/README.md) — federated login that typically finishes by setting a local session cookie.
