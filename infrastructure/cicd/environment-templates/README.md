---
title: "Identity Environment Templates (IaC)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Identity Environment Templates (Infrastructure as Code)

Copyable, parameterized templates for standing up identity platform environments **as code**,
each with a GitHub Actions deployment workflow. Fork a platform folder into your own IaC repo,
set your variables and secrets, and use the included workflow to plan on pull requests and apply
on merge.

> These are **starter templates**, not turn-key production configs. Every value is generic and
> meant to be reviewed and adapted. Always run a plan and read it before applying to a real
> tenant. Nothing here contains real secrets.

## Platforms

| Platform | IaC approach | Folder |
|---|---|---|
| Okta (Workforce Identity) | Terraform (`okta/okta` provider) | [`okta/`](okta/README.md) |
| Auth0 (CIAM) | Terraform (`auth0/auth0` provider) | [`auth0/`](auth0/README.md) |
| SailPoint Identity Security Cloud (ISC) | SP-Config JSON + SailPoint CLI/API | [`sailpoint-isc/`](sailpoint-isc/README.md) |
| Microsoft Entra ID | Terraform (`azuread` provider) | [`entra-id/`](entra-id/README.md) |
| Active Directory (on-prem) | PowerShell baseline (OUs, groups, tiering) | [`active-directory/`](active-directory/README.md) |

## How these templates are meant to be used

1. Copy one platform folder into a **dedicated IaC repository** (keep identity config out of app repos).
2. Copy that folder's `workflows/deploy.yml` to your repo's `.github/workflows/deploy.yml`.
3. Fill in `*.tfvars.example` / `*.example` files and store real credentials as **GitHub Actions
   secrets** (or, better, use OIDC federation where the provider supports it).
4. Open a PR → the workflow runs a **plan / validate** and posts it for review.
5. Merge to the default branch → the workflow **applies**, gated by a protected `production`
   environment (manual approval).

## Conventions shared across all templates

- **Multi-environment.** Each template supports `dev` / `test` / `prod` via per-environment
  variable files (`env/dev.tfvars`, …) or Terraform workspaces. Never share one state across
  environments.
- **Remote state.** Terraform templates include a `backend.tf` stub — point it at S3+DynamoDB,
  Azure Storage, GCS, or Terraform Cloud. Never commit local state.
- **Secrets never in code.** API tokens, client secrets, and passwords come from CI secrets or a
  secrets manager at run time. `.gitignore` excludes `*.tfvars` (only `*.tfvars.example` is committed).
- **Least privilege.** Provision a dedicated service principal / API client per environment with
  only the scopes the template needs; rotate on a schedule.
- **Plan on PR, apply on merge.** Read-only on pull requests; changes require review and a
  protected environment approval before apply.
- **Idempotent + reversible.** Resources are declarative; deletions in a real tenant should be
  reviewed carefully (destroying an authorization server or identity profile has blast radius).

## Related diagrams

- [OIDC-to-cloud federation](../oidc-to-cloud-federation/README.md) — keyless CI auth to cloud
- [Secrets management in pipelines](../secrets-management-in-pipelines/README.md)
- [Environment protection and approvals](../environment-protection-approvals/README.md)
- [Pipeline access control](../pipeline-access-control/README.md)
- Platform behavior: [`platforms/`](../../../platforms/cloud-iam/README.md), and the identity flows in [`authentication/`](../../../authentication/oidc/README.md)

## Files per platform

Each platform folder contains a `README.md` (prerequisites, secrets, usage), the IaC source, and a
`workflows/deploy.yml` template to copy into `.github/workflows/` of your IaC repo.
