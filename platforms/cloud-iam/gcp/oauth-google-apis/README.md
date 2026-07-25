---
title: "3-Legged OAuth to Google APIs"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# 3-Legged OAuth to Google APIs

**Status:** ✅ Current

## What it is

Three-legged OAuth 2.0 is how an application acts **on behalf of a Google user** to call Google
APIs (Gmail, Drive, Calendar, Google Workspace, People). It is the OAuth 2.0 authorization-code
flow against Google's endpoints, with Google's conventions layered on: **incremental
authorization**, an explicit **consent screen** listing requested scopes, and an **offline**
refresh token issued only when the app asks for it and the user consents.

The app sends the user to Google's `/o/oauth2/v2/auth` with the desired `scope`s; the user
authenticates and consents; Google redirects back with a `code`; the app exchanges the code at
`/token` for an `access_token` (and, with `access_type=offline`, a long-lived `refresh_token`).
Public clients (SPAs, native/mobile apps) add **PKCE**; there is no client secret for those.

## When it is used

- Any app reading or writing a user's Gmail, Drive, Calendar, Photos, or Workspace data.
- Sign-in-with-Google that also needs API access beyond basic profile (OpenID Connect adds the
  `openid` scope and an ID token).
- Server-side jobs that must act for a user while offline, using a stored refresh token.

## Actors

| Actor | Role |
|---|---|
| User | Google account holder granting access |
| App | OAuth client (web server, SPA, or native app) requesting scopes |
| Google | Google's authorization server: `/auth`, `/token`, consent, JWKS |
| API | Target Google API (Gmail, Drive, Calendar, ...) |

## Key details

- Authorization: `GET https://accounts.google.com/o/oauth2/v2/auth` with `client_id`,
  `redirect_uri`, `response_type=code`, `scope` (space-separated), `state`, and for offline
  access `access_type=offline` plus optionally `prompt=consent` to force a new refresh token.
- Incremental auth: `include_granted_scopes=true` merges newly requested scopes with
  previously granted ones so the resulting token covers both.
- Token exchange: `POST https://oauth2.googleapis.com/token` with
  `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, and either
  `client_secret` (confidential clients) or `code_verifier` (PKCE, public clients).
- Response: `access_token` (Bearer, ~1 hour), `expires_in`, `scope`, `token_type`, and
  `refresh_token` (only on the first offline consent), plus an `id_token` when `openid` was
  requested.
- Refresh: `POST /token` with `grant_type=refresh_token` and `refresh_token`. Refresh tokens for
  apps in "Testing" publishing status expire in 7 days.

## Alternate scenarios covered

- Offline access issuing a refresh token and later refreshing an expired access token.
- Incremental authorization adding a scope without re-prompting for already-granted ones.
- User denies consent at the screen — `error=access_denied` on the redirect.
- Invalid or expired/revoked refresh token — `invalid_grant`, restart authorization.

## Security notes

- Request the **narrowest** scopes; sensitive/restricted scopes (full Gmail/Drive) trigger
  Google's app verification and security assessment.
- Public clients must use PKCE and have no client secret; confidential clients keep the secret
  server-side only.
- Always validate `state` to defend against CSRF on the redirect, and validate any `id_token`
  against Google's JWKS (`iss`, `aud`, `exp`).
- Store refresh tokens encrypted; a leaked refresh token grants offline access until revoked.
- Users can revoke at any time via their Google Account; handle `invalid_grant` by re-consenting.

## Related diagrams

- [Application Default Credentials](../application-default-credentials/README.md) — how Google client libraries find credentials, including user OAuth.
- [Service account impersonation](../service-account-impersonation/README.md) — the workload (2-legged) counterpart to acting as a user.
- [GCP Workload Identity Federation](../workload-identity-federation/README.md) — federating external identities instead of a user consent flow.
- [Authorization Code (confidential)](../../../../authentication/oidc/authorization-code/README.md) — the generic OIDC flow this specializes.
- [Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md) — the public-client hardening applied here.
- [Refresh Token](../../../../authentication/oidc/refresh-token/README.md) — the offline-token rotation model.

## Files

- [sequence.md](./sequence.md) — consent and code exchange happy path, with offline refresh, incremental auth, and denial alternates.
- [swimlane.md](./swimlane.md) — lanes for User, App, Google, API.
- [flowchart.md](./flowchart.md) — consent, offline, and refresh decision gates with error terminals.
