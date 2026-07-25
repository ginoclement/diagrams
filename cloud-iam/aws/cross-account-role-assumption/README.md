---
title: "AWS Cross-Account Role Assumption"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AWS Cross-Account Role Assumption

**Status:** ✅ Current

## What it is

Cross-account role assumption lets a principal in **account A** obtain temporary credentials for
a role that lives in **account B**, without any long-lived keys shared between the accounts. The
role in account B carries a **trust policy** (`AssumeRolePolicyDocument`) whose `Principal` names
account A (an account root, a specific role, or an IAM user). The caller in account A holds an
identity policy allowing `sts:AssumeRole` on the account-B role ARN. Both sides must allow the
hop: the trust policy is the resource-side gate, the identity policy is the caller-side gate.

The canonical hardening for third-party (vendor) access is the **`ExternalId`**. A vendor is a
"deputy" that many customers trust; without `ExternalId`, a malicious customer could trick the
vendor into using its privileges against another customer's role — the **confused-deputy**
problem. The trust policy pins `sts:ExternalId` to a per-customer secret the vendor must present,
so the vendor cannot be tricked into acting on the wrong account.

## When it is used

- Central identity or CI/CD account assuming roles in many workload accounts (hub-and-spoke).
- A monitoring, backup, or security vendor accessing your account under a dedicated role.
- Organizations using `aws:PrincipalOrgID` to trust any principal within the same AWS Org.
- Any place long-lived cross-account IAM users would otherwise be created.

## Actors

| Actor | Role |
|---|---|
| Caller | Principal in account A (IAM user or role) invoking `sts:AssumeRole` |
| STS | AWS Security Token Service issuing the temporary credentials |
| TrustB | The account-B role trust policy, evaluated as the resource-side gate |
| RoleB | The account-B role whose permissions bound the resulting session |
| API | Account-B service the temporary credentials are used against |

## Key details

- Trust policy in account B: `Principal` = `arn:aws:iam::<A>:root` (whole account) or a specific
  role/user ARN, plus conditions such as `sts:ExternalId`, `aws:PrincipalOrgID`,
  `aws:SourceAccount`, `aws:MultiFactorAuthPresent`.
- Naming account A as `:root` delegates the account-B side of trust to account A's own IAM — the
  caller still needs an identity policy allowing `sts:AssumeRole`.
- `ExternalId` is chosen by the resource owner (account B / the vendor's setup), unique per
  customer, and never guessable or shared across customers.
- The assumed-role session ARN is
  `arn:aws:sts::<B>:assumed-role/<RoleName>/<RoleSessionName>`, and `RoleSessionName` shows up in
  account B's CloudTrail.
- Role chaining (account-A role, then account-B role, then account-C role) caps `DurationSeconds`
  at 3600 seconds per hop.

## Alternate scenarios covered

- Third-party access with a matching vs missing/wrong `ExternalId` (confused-deputy defense).
- Org-scoped trust via `aws:PrincipalOrgID` instead of enumerating account ids.
- Role chaining across a third account, with the 1-hour duration cap.
- Trust policy naming `:root` but the caller lacking the `sts:AssumeRole` identity policy — denied.

## Security notes

- Both gates must allow: a permissive trust policy (`Principal: "*"` or bare `:root` with no
  conditions) is the classic cross-account misconfiguration.
- Always require `ExternalId` for third parties; the vendor must not let customers choose it, and
  it must differ per customer.
- Prefer `aws:PrincipalOrgID` / `aws:SourceAccount` conditions over wildcard principals.
- Temporary credentials cannot be revoked before expiry; use the `AWSRevokeOlderSessions`
  deny-on-`aws:TokenIssueTime` pattern to cut active sessions.
- Scope `RoleB` permissions tightly — cross-account trust grants whatever the role can do.

## Related diagrams

- [STS AssumeRole](../sts-assumerole/README.md) — the single-account mechanics this builds on.
- [AssumeRoleWithWebIdentity (OIDC)](../assumerole-web-identity-oidc/README.md) — federated cross-boundary variant for external OIDC identities.
- [AssumeRoleWithSAML](../assumerole-saml/README.md) — federated cross-boundary variant for enterprise SAML identities.
- [SigV4 request signing](../sigv4-request-signing/README.md) — how the returned credentials sign the account-B API calls.

## Files

- [sequence.md](sequence.md) — the two-account hop with ExternalId, org-scoped, and chaining alternates.
- [swimlane.md](swimlane.md) — lanes for Caller, STS, TrustB, RoleB, API.
- [flowchart.md](flowchart.md) — the trust + identity + ExternalId decision gates with deny terminals.
