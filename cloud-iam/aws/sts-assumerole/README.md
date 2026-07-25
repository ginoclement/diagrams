---
title: "AWS STS AssumeRole"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AWS STS AssumeRole

**Status:** ✅ Current

## What it is

`sts:AssumeRole` is the core AWS Security Token Service (STS) API for obtaining
**temporary security credentials** (an `AccessKeyId`, `SecretAccessKey`, and
`SessionToken`) by assuming an IAM role. The caller is an already-authenticated AWS
principal (an IAM user, another role, or a service). Whether the call succeeds is decided
by two policies that must **both** allow it: the caller's identity policy
(`Action: sts:AssumeRole` on the role ARN) and the role's **trust policy** (the
`AssumeRolePolicyDocument`, which names the allowed principals). STS returns credentials
scoped to the role's permissions, optionally narrowed further by an inline **session
policy**, and valid for `DurationSeconds` (15 minutes up to the role's `MaxSessionDuration`,
max 12 hours).

## When it is used

- An IAM user or role escalating into a task-specific role (least-privilege separation).
- Cross-account access, where a role in account B trusts a principal in account A (see
  [Cross-account role assumption](../cross-account-role-assumption/README.md)).
- Third-party/vendor access into your account, hardened with an `ExternalId` to defeat the
  confused-deputy problem.
- Short-lived, auditable credentials in place of long-lived IAM user access keys.

## Actors

| Actor | Role |
|---|---|
| Caller | Authenticated AWS principal (IAM user or role) invoking `sts:AssumeRole` |
| STS | AWS Security Token Service endpoint issuing temporary credentials |
| IAM | Evaluates the caller identity policy and the role trust policy |
| Role | The target IAM role whose permissions and `MaxSessionDuration` bound the session |
| API | Downstream AWS service the temporary credentials are used against |

## Key API details

- Request parameters: `RoleArn`, `RoleSessionName` (required, appears in CloudTrail and the
  assumed-role ARN), optional `ExternalId`, `Policy` / `PolicyArns` (session policies),
  `DurationSeconds`, `Tags` / `TransitiveTagKeys`, `SerialNumber` + `TokenCode` (MFA).
- Response: `Credentials` block plus `AssumedRoleUser` with the ARN
  `arn:aws:sts::<acct>:assumed-role/<RoleName>/<RoleSessionName>`.
- Effective permissions are the **intersection** of the role's identity/permissions policies
  and any session policy — a session policy can only restrict, never grant beyond the role.
- Trust policy condition keys commonly used: `sts:ExternalId`, `aws:PrincipalOrgID`,
  `aws:SourceAccount`, `aws:MultiFactorAuthPresent`, `sts:RoleSessionName`.

## Alternate scenarios covered

- MFA-required role: trust policy asserts `aws:MultiFactorAuthPresent=true`; caller must pass
  `SerialNumber` and `TokenCode`.
- `ExternalId` mismatch for third-party access — denied.
- Session policy narrows permissions below the role's own policy.
- `DurationSeconds` exceeding the role's `MaxSessionDuration` — validation error.
- Role chaining (assumed-role credentials assuming another role) — capped at 1 hour.

## Security notes

- Both the identity policy **and** the trust policy must allow the assume; a broad trust
  policy is the usual misconfiguration — scope the `Principal` and add conditions.
- Always require `ExternalId` for third-party/vendor roles; never let the vendor choose it
  arbitrarily and never reuse one across customers.
- Prefer conditions (`aws:PrincipalOrgID`, `aws:SourceAccount`) over wildcard principals.
- Temporary credentials cannot be revoked individually before expiry; to cut off active
  sessions attach a deny policy on `aws:TokenIssueTime` (AWSRevokeOlderSessions pattern).
- Set `MaxSessionDuration` conservatively; role chaining caps duration at 1 hour regardless.

## Related diagrams

- [Cross-account role assumption](../cross-account-role-assumption/README.md) — the two-account trust hop with `ExternalId`.
- [AssumeRoleWithWebIdentity (OIDC)](../assumerole-web-identity-oidc/README.md) — federated variant for external OIDC identities.
- [AssumeRoleWithSAML](../assumerole-saml/README.md) — federated variant for enterprise SAML identities.
- [IMDSv2 instance credentials](../imdsv2-instance-credentials/README.md) — how EC2 role credentials are delivered.
- [SigV4 request signing](../sigv4-request-signing/README.md) — how the returned credentials sign API calls.

## Files

- [sequence.md](sequence.md) — the AssumeRole call and credential use, with MFA and ExternalId alternates.
- [swimlane.md](swimlane.md) — lanes for Caller, STS, IAM, Role, API.
- [flowchart.md](flowchart.md) — the trust-and-identity policy decision gates with deny terminals.
