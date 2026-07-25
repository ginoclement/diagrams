# OAuth 2.0 to Google APIs (3-Legged)

**Status:** ✅ Current

## What it is

The user-consent flow an application uses to call Google APIs (Gmail, Drive, Calendar, and
Google Cloud APIs) **on behalf of a signed-in user**. It is OAuth 2.0 Authorization Code with
Google's endpoints: the app redirects the user to Google's authorization server
(`https://accounts.google.com/o/oauth2/v2/auth`), the user authenticates and grants the
requested **scopes** on a consent screen, Google returns an authorization code, and the app
exchanges it at the **token endpoint** (`https://oauth2.googleapis.com/token`) for an
**access token** and — when `access_type=offline` and consent is fresh — a long-lived
**refresh token**. Google supports **incremental authorization** (`include_granted_scopes=true`),
requesting more scopes over time without discarding earlier grants.

## When it is used

- Any app acting for an end user against Google APIs (a SaaS integration reading a user's Drive,
  a backup tool for Gmail, a calendar assistant).
- The source of the user credentials that `gcloud auth application-default login` stores for ADC.

## Actors

| Actor | Role |
|---|---|
| User | The Google account owner granting access |
| App | OAuth client (web server, installed, or SPA) requesting scopes |
| Browser | User agent carrying the authorization request and consent |
| Google | Google's authorization server: `/auth` and `/token` endpoints |
| API | The Google API (Drive, Gmail, ...) the access token is used against |

## Key parameters

- `/auth`: `client_id`, `redirect_uri`, `response_type=code`, `scope` (space-delimited),
  `state`, `access_type=offline` (to get a refresh token), `prompt=consent` (force the consent
  screen), `include_granted_scopes=true` (incremental auth), and PKCE (`code_challenge`) for
  public clients.
- `/token`: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`,
  `client_secret` (web apps) or `code_verifier` (PKCE), returning `access_token`, `expires_in`,
  `scope`, and optionally `refresh_token` and an OIDC `id_token`.
- **Refresh**: `grant_type=refresh_token` returns a new access token without user interaction;
  refresh tokens persist until revoked or (for unverified/testing apps) expire.
- Scopes are the unit of consent; sensitive/restricted scopes require Google's app verification.

## Alternate scenarios covered

- User denies consent → `error=access_denied`.
- No refresh token returned (online access, or consent already granted without `prompt=consent`).
- Incremental authorization adding a scope later without losing prior grants.
- Refresh-token grant to mint a new access token; refresh token revoked → re-consent required.

## Security notes

- Use PKCE for installed/SPA clients (no usable client secret); use the client secret only in
  confidential web-server apps.
- Request the **minimum scopes** needed; restricted scopes (Gmail/Drive full access) trigger app
  verification and stricter review.
- Store refresh tokens as secrets; support revocation and rotation. A leaked refresh token grants
  offline access until revoked.
- Always validate `state` (CSRF) and, if using `id_token`, its signature/`aud`/`nonce`.

## Related diagrams

- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the generic hardened code flow
- [Application Default Credentials](../application-default-credentials/README.md) — where gcloud stores these user credentials
- [Identity-Aware Proxy](../identity-aware-proxy/README.md) — Google sign-in reused as an access gate
- [Refresh Token](../../oidc/refresh-token/README.md) — rotation and offline-access details

## Files

- [sequence.md](sequence.md) — consent + code exchange happy path plus deny, no-refresh, incremental, and refresh alternates
- [swimlane.md](swimlane.md) — lanes for User, App, Browser, Google, API
- [flowchart.md](flowchart.md) — consent, scope, and refresh decision tree with error terminals
