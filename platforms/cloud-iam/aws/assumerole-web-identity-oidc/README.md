---
title: "AssumeRoleWithWebIdentity (OIDC Federation)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AssumeRoleWithWebIdentity (OIDC Federation)

**Status:** 🔵 Emerging

## What it is

`sts:AssumeRoleWithWebIdentity` exchanges a signed **OIDC ID token** (a JWT) from an
external identity provider for temporary AWS credentials — with **no long-lived AWS
access keys** involved. AWS is configured with an **IAM OIDC identity provider** that
records the issuer URL and a **thumbprint** of the issuer's TLS certificate (or, for
well-known issuers, AWS validates the token signature against the issuer's published
**JWKS**). The role's trust policy conditions the assume on JWT claims — typically `aud`
(audience/client-id) and `sub` (subject) — so only tokens from the intended workload can
assume the role.

The flagship use is **GitHub Actions deploying to AWS keylessly**: the workflow requests
an OIDC token from GitHub (`token.actions.githubusercontent.com`), calls
`AssumeRoleWithWebIdentity`, and receives short-lived credentials scoped to the deploy
role — replacing stored `AWS_ACCESS_KEY_ID` secrets entirely.

## When it is used

- CI/CD pipelines (GitHub Actions, GitLab CI, CircleCI) deploying to AWS without static keys.
- Mobile/web apps federating end users via Google, Facebook, Apple, or a custom OIDC IdP —
  though [Cognito identity pools](../cognito-identity-pool/README.md) usually front this.
- Any external workload holding an OIDC token that should get scoped, short-lived AWS access.

## Actors

| Actor | Role |
|---|---|
| Workload | External client (e.g. a GitHub Actions job) needing AWS access |
| OIDC IdP | Token issuer (`token.actions.githubusercontent.com`, Google, etc.) publishing JWKS |
| STS | AWS Security Token Service, endpoint for `AssumeRoleWithWebIdentity` |
| IAM | Holds the OIDC provider config and evaluates the role trust policy |
| Role | Target IAM role whose trust policy pins `aud` and `sub` claims |

## Key API and config details

- Request: `RoleArn`, `RoleSessionName`, `WebIdentityToken` (the raw JWT); **no** AWS
  signature — this call is unsigned because the JWT is the proof.
- IAM OIDC provider object stores the issuer `Url`, a `ClientIDList` (allowed `aud`
  values), and a `ThumbprintList`. AWS now validates most issuers via JWKS directly, but
  the thumbprint remains part of the provider object.
- Trust policy `Condition` keys use the issuer host as a prefix, e.g.
  `token.actions.githubusercontent.com:aud` and `:sub`. Use `StringEquals` for `aud` and
  `StringLike` for scoped `sub` matches like `repo:my-org/my-repo:ref:refs/heads/main`.
- STS validates: JWT signature (via JWKS), `iss` matches the provider `Url`, `aud` in
  `ClientIDList`, `exp` not passed, then the trust-policy claim conditions.

## Alternate scenarios covered

- `sub` too broad (e.g. `repo:my-org/*`) letting the wrong branch or fork assume the role.
- Missing `aud` condition — the classic misconfiguration that lets any GitHub org's token in.
- Expired or replayed JWT — rejected on `exp` / signature.
- Unregistered issuer (no matching IAM OIDC provider) — denied.

## Security notes

- **Always** pin both `aud` and a tightly scoped `sub` in the trust policy. An `aud`-only
  policy on the GitHub issuer trusts every repository on GitHub.
- Scope `sub` to specific `repo:`, `ref:`, `environment:`, or `pull_request` contexts;
  wildcards widen the blast radius to forks and other branches.
- Tokens are short-lived and single-purpose; never log or export the `WebIdentityToken`.
- Prefer JWKS-based validation (AWS handles this for GitHub) so a rotated issuer cert does
  not silently break or bypass the thumbprint.
- Give the assumed role least privilege — it is reachable by anything that can mint a
  matching token.

## Related diagrams

- [STS AssumeRole](../sts-assumerole/README.md) — the base API and trust-policy model.
- [IRSA on EKS](../irsa-eks/README.md) — the same web-identity mechanism using EKS projected SA tokens.
- [Cognito identity pool](../cognito-identity-pool/README.md) — consumer-facing wrapper over web-identity federation.
- [AssumeRoleWithSAML](../assumerole-saml/README.md) — the SAML sibling for enterprise IdPs.
- [OIDC Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md) — how the ID token itself is obtained in interactive flows.

## Files

- [sequence.md](./sequence.md) — GitHub-Actions-to-AWS happy path plus claim-condition failures.
- [swimlane.md](./swimlane.md) — lanes for Workload, OIDC IdP, STS, IAM, Role.
- [flowchart.md](./flowchart.md) — token and trust-policy validation gates with deny terminals.
