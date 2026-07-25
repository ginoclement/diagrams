---
title: "OAuth 2.0 / OIDC Refresh Token Grant"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 / OIDC Refresh Token Grant

**Status:** ✅ Current

Renewing access tokens without user interaction. A client that received a `refresh_token`
(for OIDC, by requesting the `offline_access` scope, subject to consent) presents it at
`/token` with `grant_type=refresh_token` and gets a fresh access token — and, with
**rotation**, a fresh refresh token while the old one is invalidated. Rotation enables
**reuse detection**: if a rotated (already-used) refresh token is presented again, two
parties hold copies — one is a thief — so the AS revokes the entire token *family* and
forces re-authentication.

## When it's used

- Any long-lived client session that outlives short access-token lifetimes (web apps,
  SPAs, native apps).
- Offline access: jobs acting for a user while they're absent (`offline_access` scope).
- Public clients **must** rotate; confidential clients should (Security BCP), or at least
  sender-constrain the refresh token.

## Actors

| Actor | Role |
|---|---|
| User | Present only at initial authorization (consent to `offline_access`) |
| Client | Holds and presents the refresh token |
| IdP | Authorization server tracking token families |
| API | Resource server consuming the renewed access tokens |
| Attacker | Holder of a stolen refresh token (reuse-detection alternate) |

## Key parameters

- Initial grant: `/authorize ... scope=openid offline_access` → `/token` returns
  `access_token`, `refresh_token`, `expires_in`.
- Refresh: `POST /token grant_type=refresh_token&refresh_token=...` (+ client auth for
  confidential clients; public clients send `client_id`).
- Optional `scope` parameter to **narrow** (never widen) the renewed access token.
- Errors: `invalid_grant` (expired, revoked, reused, unknown token), `invalid_client`.

## Expiry models (flowchart decision)

- **Sliding expiry**: each successful refresh extends the family's idle window
  (e.g. "expires after 30 days of inactivity").
- **Absolute expiry**: a hard ceiling from initial authorization (e.g. 90 days) after which
  re-authentication is required regardless of activity.
- Robust deployments combine both: sliding idle timeout **capped** by an absolute lifetime.

## Alternates covered in the diagrams

- Rotation happy path: new access + refresh token, predecessor invalidated.
- Reuse detection: replay of a rotated token → whole family revoked, both holders locked out,
  legitimate client forced through interactive re-auth.
- Scope narrowing on refresh.
- Expired family (sliding or absolute) → `invalid_grant` → interactive re-auth.

## Security notes

- Reuse detection only works if the AS keeps family lineage; log and alert on trips — each
  one is a probable token theft.
- Store refresh tokens in the most protected storage available (server-side session,
  OS keystore); never in SPA localStorage if avoidable — or keep them in a backend-for-frontend.
- Sender-constraining (mTLS or DPoP) beats rotation alone: a stolen token can't be used at all.
- Revoke the family on logout ([RP-Initiated Logout](../rp-initiated-logout/README.md)),
  password change, and [leaver events](../../user-lifecycle/leaver-offboarding/README.md).

## Diagrams

- [sequence.md](sequence.md) — initial grant, rotation, and the reuse-detection alternate.
- [swimlane.md](swimlane.md) — Client, IdP, API lanes plus the attacker branch.
- [flowchart.md](flowchart.md) — sliding vs absolute expiry and family-revocation decisions.

## Related diagrams

- [Authorization Code](../authorization-code/README.md) — where the first refresh token comes from.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — public clients, where rotation is mandatory.
- [Client Credentials](../client-credentials/README.md) — M2M: no refresh tokens, just re-request.
- [Back-Channel Logout](../back-channel-logout/README.md) — server-side teardown that should revoke families.
- [Password Self-Service Reset](../../password-management/self-service-reset/README.md) — an event that must revoke refresh tokens.
