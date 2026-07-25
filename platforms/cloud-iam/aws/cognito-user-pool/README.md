---
title: "Amazon Cognito User Pool Sign-In"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Amazon Cognito User Pool Sign-In

**Status:** ✅ Current

## What it is

A **Cognito user pool** is a managed OpenID Provider / user directory. Applications sign
users in either through the pool's **Hosted UI** (a ready-made login/signup site at
`https://<domain>.auth.<region>.amazoncognito.com`) or directly against the user pool
authentication APIs. The Hosted UI implements standard **OAuth 2.0 / OIDC** endpoints
(`/oauth2/authorize`, `/oauth2/token`, `/oauth2/userInfo`, `/.well-known/jwks.json`), so a
public client uses the [Authorization Code flow with PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md)
to obtain three JWTs: an **ID token** (identity claims), an **access token** (OAuth scopes
for APIs and the pool's own operations), and a **refresh token**. The user pool can also
federate to external social/enterprise IdPs and relay the result as its own tokens.

These tokens authenticate the user to the app and its APIs. To turn them into **AWS IAM
credentials** you additionally exchange the ID token at a
[Cognito identity pool](../cognito-identity-pool/README.md) — user pools alone do not grant
AWS API access.

## When it is used

- Consumer and B2B web/mobile apps that need managed sign-up, sign-in, MFA, and password
  reset without building an IdP.
- Apps that want OIDC tokens for their own backend APIs (validated via JWKS).
- A federation hub in front of Google/Apple/Facebook or a corporate SAML/OIDC IdP.

## Actors

| Actor | Role |
|---|---|
| User | Human signing in or signing up |
| App | Client application (SPA, mobile, or web) — a user pool app client |
| HostedUI | Cognito Hosted UI / OAuth2 endpoints of the user pool |
| UserPool | Cognito user pool directory authenticating the user and minting JWTs |
| API | Resource server validating the access/ID token via JWKS |

## Key mechanics

- App client config: `client_id`, allowed OAuth flows (`code`), scopes
  (`openid profile email` plus custom resource-server scopes), callback URLs; public
  clients have **no secret** and use PKCE.
- Token endpoint returns `id_token`, `access_token`, `refresh_token`; tokens are RS256 JWTs
  signed by the pool, verifiable at `/.well-known/jwks.json`.
- Direct API auth (SDK) uses `InitiateAuth` / `RespondToAuthChallenge` with the
  **SRP (Secure Remote Password)** flow (`USER_SRP_AUTH`) so the password never crosses the
  wire, plus MFA challenges (`SMS_MFA`, `SOFTWARE_TOKEN_MFA`).
- Federation: user picks an external IdP at the Hosted UI; Cognito completes SAML/OIDC with
  that IdP, maps attributes, and issues **its own** pool tokens.

## Alternate scenarios covered

- MFA challenge (TOTP or SMS) after the first factor.
- Federated sign-in via an external IdP relayed as pool tokens.
- New-password-required / force-change-password challenge.
- Invalid credentials and expired access token → refresh with the refresh token.

## Security notes

- Public clients (SPA/mobile) must use Authorization Code + PKCE, never the deprecated
  implicit flow; do not embed a client secret in a public client.
- Validate tokens on the API by checking signature (JWKS), `iss` (the pool URL), `aud`/
  `client_id`, `token_use` (`id` vs `access`), and `exp`.
- Prefer TOTP over SMS MFA where possible; SMS OTP is weak against SIM-swap.
- Refresh tokens are long-lived — store them securely and support revocation.
- Use the ID token for identity, the access token for authorization/scopes; do not
  authorize APIs off the ID token.

## Related diagrams

- [Cognito identity pool](../cognito-identity-pool/README.md) — exchange these tokens for temporary AWS credentials.
- [OIDC Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md) — the flow the Hosted UI implements for public clients.
- [OIDC Implicit](../../../../authentication/oidc/implicit/README.md) — the legacy flow to avoid for SPAs.
- [SAML SP-initiated SSO](../../../../authentication/saml/sp-initiated-sso/README.md) — enterprise federation feeding the pool.

## Files

- [sequence.md](./sequence.md) — Hosted UI PKCE sign-in with MFA, federation, and refresh alternates.
- [swimlane.md](./swimlane.md) — lanes for User, App, HostedUI, UserPool, API.
- [flowchart.md](./flowchart.md) — authentication and challenge decision gates with error terminals.
