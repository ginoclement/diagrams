# Auth0 Universal Login + Actions (Post-Login Pipeline)

**Status:** ✅ Current

**Auth0 Universal Login** is Auth0's hosted, centralized login page; **Actions** are
Node.js functions Auth0 runs at defined **triggers** in a flow. This diagram covers
the **post-login** trigger: after the user authenticates at Universal Login, Auth0
runs the ordered post-login Actions **before** issuing tokens. Each Action receives
an `event` (user, request, context) and an `api` object, and can:

- **enrich tokens** — `api.idToken.setCustomClaim(...)` / `api.accessToken.setCustomClaim(...)`;
- **require MFA** — `api.multifactor.enable("any")`;
- **deny access** — `api.access.deny(reason)`;
- **redirect out and resume** — `api.redirect.encodeToken(...)` then continue on return.

## What makes this Auth0-specific (vs the generic flow)

The token itself is issued by the standard
[OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) flow
(app -> `/authorize` -> tokens) — not re-drawn here. What is Auth0-specific is the
**Actions pipeline that runs between authentication and token issuance**: the
ordered post-login Actions, the `api.access.deny` / `api.multifactor.enable` /
`api.redirect` primitives, the **redirect-and-resume** (continue) pattern, and the
separate **client-credentials-exchange** trigger for M2M tokens.

## When it is used

- Adding custom claims (roles, tenant, entitlements) into tokens at login.
- Conditional / adaptive MFA driven by risk signals in an Action.
- Blocking sign-in based on business rules (geo, trial expired, banned user).
- Redirecting mid-login to collect consent / progressive profile, then resuming.
- Enriching M2M access tokens via the client-credentials-exchange trigger.

## Actors

| Actor | Role |
|---|---|
| User | Human authenticating at Universal Login |
| App | OIDC/OAuth client initiating `/authorize` |
| Auth0 Tenant | Auth0 tenant: Universal Login page, Actions runtime, token endpoint |
| Action | Your Node.js post-login function (`event` + `api`) |
| External API | Optional service an Action calls to fetch claims / risk |

## Alternate scenarios covered

- **Redirect from an Action + resume** — an Action calls `api.redirect.encodeToken`;
  the user is sent to your site and returns to `/continue`, where the pipeline
  resumes.
- **Deny access** — an Action calls `api.access.deny`; no tokens are issued.
- **M2M client-credentials-exchange trigger** — no user; an Action customizes the
  machine token on the client-credentials grant.

## Related diagrams

- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the login + token issuance Universal Login implements.
- [OAuth 2.0 Client Credentials](../../oidc/client-credentials/README.md) — the M2M grant the credentials-exchange Action extends.
- [Auth0 Organizations Invitation](../auth0-organizations-invitation/README.md) — B2B org context that Actions can read via `event.organization`.

## Files

- [sequence.md](sequence.md) — authorize, Universal Login, post-login Actions, tokens; redirect/deny/M2M alts.
- [swimlane.md](swimlane.md) — lanes for User, App, Auth0 Tenant, Action, External API.
- [flowchart.md](flowchart.md) — Actions pipeline decision logic with deny / redirect / MFA branches.
