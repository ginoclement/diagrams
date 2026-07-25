---
title: "AWS IAM Identity Center SSO (formerly AWS SSO)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AWS IAM Identity Center SSO (formerly AWS SSO)

**Status:** ✅ Current

## What it is

**IAM Identity Center** is AWS's managed workforce SSO service for multi-account
environments. It connects an identity source (its own directory, or an external IdP via
SAML/SCIM such as Okta or Entra ID) to AWS accounts in an Organization. Administrators
define **permission sets** — reusable collections of policies that Identity Center
materializes as IAM roles in each target account — and create **account assignments**
binding a user or group + permission set + account. Users reach everything through a single
**AWS access portal**; behind the scenes Identity Center performs an STS
`AssumeRole` into the permission-set role to hand out short-lived credentials for the
console or CLI.

For the CLI, `aws sso login` runs the **OAuth 2.0 device authorization / authorization code
with PKCE** flow to obtain an SSO access token, then calls the SSO Portal API
(`sso:GetRoleCredentials`) to retrieve temporary role credentials per account. This
replaces the older one-role-per-account [AssumeRoleWithSAML](../assumerole-saml/README.md)
pattern with centralized assignment.

## When it is used

- Any organization managing more than a couple of AWS accounts that wants central,
  auditable, least-privilege human access.
- Workforce console and CLI access with short-lived credentials and no IAM users.
- Federating an existing corporate IdP once, then assigning access across all accounts.

## Actors

| Actor | Role |
|---|---|
| User | Workforce identity signing in through the AWS access portal |
| Browser/CLI | User agent (portal in a browser, or `aws sso login` device flow) |
| IdentityCenter | IAM Identity Center: authenticates, holds permission sets and assignments |
| STS | Issues temporary credentials by assuming the permission-set role |
| Account | Target AWS account containing the provisioned permission-set IAM role |

## Key mechanics

- **Permission set**: a template (managed + inline policies, session duration,
  `PermissionsBoundary`) provisioned as an IAM role named
  `AWSReservedSSO_<PermissionSetName>_<hash>` in each assigned account.
- **Account assignment**: (principal = user/group) x (permission set) x (account). Removing
  it deprovisions the role binding.
- **Identity source**: Identity Center directory, Active Directory, or external SAML IdP
  with SCIM provisioning for users/groups.
- **CLI token flow**: `aws sso login` uses OAuth device/authorization-code + PKCE to get an
  SSO OIDC access token; `sso:GetRoleCredentials` exchanges it for role credentials cached
  under `~/.aws/sso/cache`.
- ABAC via session tags/attributes from the identity source is supported in the
  permission-set trust and policies.

## Alternate scenarios covered

- External IdP as identity source — SAML sign-in feeds Identity Center.
- CLI `aws sso login` device-authorization variant vs the browser portal.
- User has no assignment for the chosen account — access denied.
- SSO access token expired — re-authentication required.

## Security notes

- Credentials are short-lived (permission-set session duration, up to 12 hours) and scoped
  per account+permission set — no standing keys.
- Manage access by group assignment, not per-user, and keep permission sets least-privilege
  with a `PermissionsBoundary` where appropriate.
- SCIM deprovisioning removes portal access promptly when the source identity is disabled.
- Central CloudTrail across the Organization records `AssumeRole` and
  `GetRoleCredentials` for every session.
- Prefer Identity Center over per-account [AssumeRoleWithSAML](../assumerole-saml/README.md)
  and over IAM users for humans.

## Related diagrams

- [AssumeRoleWithSAML](../assumerole-saml/README.md) — the older per-account federation this supersedes.
- [STS AssumeRole](../sts-assumerole/README.md) — the primitive Identity Center calls internally.
- [AssumeRoleWithWebIdentity (OIDC)](../assumerole-web-identity-oidc/README.md) — OIDC federation for workloads (not humans).
- [OIDC Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md) — the CLI login token flow.
- [SAML SP-initiated SSO](../../../../authentication/saml/sp-initiated-sso/README.md) — external IdP sign-in feeding the identity source.

## Files

- [sequence.md](./sequence.md) — portal and CLI sign-in to credentials, with external-IdP and no-assignment alternates.
- [swimlane.md](./swimlane.md) — lanes for User, Browser/CLI, IdentityCenter, STS, Account.
- [flowchart.md](./flowchart.md) — assignment and token decision gates with deny terminals.
