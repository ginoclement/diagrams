# AssumeRoleWithSAML (Enterprise SAML to AWS)

**Status:** ✅ Current

## What it is

`sts:AssumeRoleWithSAML` exchanges a **SAML 2.0 assertion** from an enterprise identity
provider (ADFS, Okta, Entra ID, Ping, Shibboleth) for temporary AWS credentials. The
enterprise IdP performs a SAML Web Browser SSO to a special AWS SAML endpoint (the
`https://signin.aws.amazon.com/saml` Assertion Consumer Service for the console, or a
programmatic exchange for CLI). AWS matches the assertion's `Issuer` to a configured **IAM
SAML identity provider** object and reads the
`https://aws.amazon.com/SAML/Attributes/Role` attribute, which contains one or more
`RoleARN,PrincipalARN` pairs — the principal ARN being the IAM SAML provider, the role ARN
the role to assume. The role's trust policy authorizes the SAML provider as principal with
`Action: sts:AssumeRoleWithSAML` and a `SAML:aud` condition.

This is the long-standing way to give a corporate directory federated access to AWS. It
**predates AWS IAM Identity Center**; for new deployments AWS now recommends
[IAM Identity Center](../iam-identity-center-sso/README.md), which centralizes permission
sets and multi-account assignment on top of the same STS primitives.

## When it is used

- Existing enterprise SAML IdPs granting employees console and CLI access to one or a few
  AWS accounts, without provisioning IAM users.
- Environments standardized on SAML that have not yet migrated to IAM Identity Center.
- CLI/API access via helper tools that script the SAML browser flow and call
  `AssumeRoleWithSAML`.

## Actors

| Actor | Role |
|---|---|
| User | Employee authenticating at the corporate IdP |
| Browser | User agent carrying the SAML front-channel messages |
| IdP | Enterprise SAML Identity Provider issuing the signed assertion |
| STS | AWS Security Token Service consuming the assertion via `AssumeRoleWithSAML` |
| IAM | Holds the SAML provider metadata and the role trust policy |

## Key protocol and API details

- The IdP posts a base64 `SAMLResponse` to the AWS ACS URL (HTTP-POST binding), exactly as
  in generic [SP-initiated SSO](../../../saml/sp-initiated-sso/README.md) — AWS is the SP.
- Required SAML attributes: `Role` (one or more `RoleARN,PrincipalARN` pairs) and
  `RoleSessionName` (`https://aws.amazon.com/SAML/Attributes/RoleSessionName`); optional
  `SessionDuration` and `PrincipalTag` attributes for ABAC.
- `AssumeRoleWithSAML` params: `RoleArn`, `PrincipalArn` (the IAM SAML provider ARN),
  `SAMLAssertion` (base64), optional `DurationSeconds`, `Policy`/`PolicyArns`.
- STS validates the assertion signature against the IdP metadata certificate stored on the
  IAM SAML provider, checks `NotBefore`/`NotOnOrAfter`, `Audience` (`SAML:aud` must be
  `https://signin.aws.amazon.com/saml`), and the trust policy.

## Alternate scenarios covered

- Multiple `Role` attribute values — user picks a role at the AWS role-selection page.
- Assertion signature invalid or expired — denied.
- `SAML:aud` mismatch (assertion not intended for AWS) — denied.
- Role trust policy omits the `SAML:aud` condition (misconfiguration) — replay exposure.

## Security notes

- The role trust policy must condition on
  `SAML:aud = https://signin.aws.amazon.com/saml` so assertions minted for other SPs cannot
  be replayed against AWS.
- Validate the assertion is signed and that STS uses the certificate from IdP metadata, not
  one embedded in the message (guards against XML Signature Wrapping).
- Keep `SessionDuration` conservative; console sessions are capped by the role
  `MaxSessionDuration`.
- Prefer migrating to [IAM Identity Center](../iam-identity-center-sso/README.md) for
  central permission sets, multi-account assignment, and short-lived console/CLI access.
- Use `PrincipalTag` SAML attributes for attribute-based access control rather than one
  role per team where practical.

## Related diagrams

- [IAM Identity Center SSO](../iam-identity-center-sso/README.md) — the recommended newer path.
- [AssumeRoleWithWebIdentity (OIDC)](../assumerole-web-identity-oidc/README.md) — the OIDC federation sibling.
- [STS AssumeRole](../sts-assumerole/README.md) — the base temporary-credential API.
- [SAML SP-initiated SSO](../../../saml/sp-initiated-sso/README.md) — the generic browser SSO AWS relies on as SP.
- [SigV4 request signing](../sigv4-request-signing/README.md) — how the returned credentials sign CLI calls.

## Files

- [sequence.md](sequence.md) — browser SSO into AWS plus role-choice and validation-failure alternates.
- [swimlane.md](swimlane.md) — lanes for User, Browser, IdP, STS, IAM.
- [flowchart.md](flowchart.md) — assertion and trust-policy validation gates with deny terminals.
