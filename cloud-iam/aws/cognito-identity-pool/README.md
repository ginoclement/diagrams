# Amazon Cognito Identity Pool (AWS Credentials Exchange)

**Status:** ✅ Current

## What it is

A **Cognito identity pool** (Cognito Federated Identities) exchanges an identity token from
a trusted login provider for **temporary AWS IAM credentials**, so a mobile/web client can
call AWS services (S3, DynamoDB, API Gateway with IAM auth) directly with least-privilege,
short-lived credentials. It is distinct from a
[user pool](../cognito-user-pool/README.md): the user pool authenticates the user and issues
JWTs; the identity pool turns a token into AWS credentials.

The client calls `GetId` to obtain a Cognito **identity ID**, then `GetCredentialsForIdentity`
(the enhanced/simplified flow) — or `GetOpenIdToken` + `sts:AssumeRoleWithWebIdentity` (the
classic/basic flow) — to receive credentials from an IAM role. The pool maps the caller to
either an **authenticated role** (a recognized login provider token was supplied) or an
**unauthenticated role** (guest access, if enabled). Role selection can be refined by
**role mapping rules** on token claims or by `cognito-identity.amazonaws.com:amr`.

## When it is used

- Mobile/single-page apps calling AWS services directly with scoped temporary credentials.
- Guest access (unauthenticated role) for anonymous features before sign-in.
- Turning a user-pool, Google, Apple, Facebook, or SAML login into AWS access without a
  backend broker.

## Actors

| Actor | Role |
|---|---|
| App | Mobile/web client requesting AWS credentials |
| LoginProvider | Token issuer (Cognito user pool, Google, Apple, SAML IdP, etc.) |
| IdentityPool | Cognito Federated Identities: `GetId`, `GetCredentialsForIdentity` |
| STS | Issues the temporary credentials (directly or via web-identity assume) |
| API | AWS service the credentials are used against (S3, DynamoDB, ...) |

## Key mechanics

- **Enhanced flow**: `GetId` -> identity ID; `GetCredentialsForIdentity(Logins map)` ->
  temporary credentials. Cognito performs the role assume server-side using the pool's
  role-mapping configuration.
- **Classic flow**: `GetId` -> `GetOpenIdToken` (a Cognito-signed OIDC token, `iss =
  cognito-identity.amazonaws.com`) -> client calls
  `sts:AssumeRoleWithWebIdentity` with it.
- `Logins` maps provider name to token, e.g.
  `cognito-idp.<region>.amazonaws.com/<userPoolId>` -> user pool ID token, or
  `accounts.google.com` -> Google ID token. An empty `Logins` requests the guest role.
- **Role mapping**: default authenticated/unauthenticated roles, plus rule-based or
  token-claim-based selection; roles' trust policies condition on
  `cognito-identity.amazonaws.com:aud` (the pool ID) and `amr` (authenticated vs
  unauthenticated).

## Alternate scenarios covered

- Unauthenticated (guest) access with an empty `Logins` map -> unauthenticated role.
- Role-mapping rules selecting different roles by claim.
- Classic flow using `AssumeRoleWithWebIdentity` explicitly.
- Invalid/expired provider token -> `NotAuthorizedException`.

## Security notes

- Scope the authenticated and unauthenticated roles tightly; the unauthenticated role is
  reachable by anyone, so grant it the absolute minimum (often nothing).
- Trust policies must condition on `cognito-identity.amazonaws.com:aud` = your pool ID so
  another pool's tokens cannot assume the role; use the `amr` condition to separate
  authenticated from guest.
- Prefer policy variables like `${cognito-identity.amazonaws.com:sub}` to isolate each
  identity's data (e.g. per-user S3 prefixes).
- Disable guest access unless a feature truly needs it.
- Credentials are short-lived; the client refreshes via the same exchange.

## Related diagrams

- [Cognito user pool](../cognito-user-pool/README.md) — the sign-in that produces the token exchanged here.
- [AssumeRoleWithWebIdentity (OIDC)](../assumerole-web-identity-oidc/README.md) — the STS call the classic flow uses.
- [STS AssumeRole](../sts-assumerole/README.md) — the underlying temporary-credential primitive.
- [SigV4 request signing](../sigv4-request-signing/README.md) — how the returned credentials sign AWS calls.

## Files

- [sequence.md](sequence.md) — enhanced-flow credential exchange plus guest, role-mapping, and classic-flow alternates.
- [swimlane.md](swimlane.md) — lanes for App, LoginProvider, IdentityPool, STS, API.
- [flowchart.md](flowchart.md) — authenticated-vs-guest and role-selection gates with deny terminals.
