---
title: "Okta Environment Template (Terraform)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Okta Environment Template (Terraform)

A copyable starter template for managing an **Okta Workforce Identity** org's configuration
**as code** with Terraform and the official [`okta/okta`](https://registry.terraform.io/providers/okta/okta/latest)
provider (v4.x). Fork this folder into a dedicated IaC repository, set your variables and secrets,
and use the included GitHub Actions workflow to plan on pull requests and apply on merge.

> This is a **starter template**, not a turn-key production config. Every value is generic and meant
> to be reviewed and adapted to your org. Always run `terraform plan` and read it before applying to
> a real Okta org. Nothing here contains real secrets.

## Overview

The Terraform in `terraform/` provisions a small, representative slice of an Okta org:

- **Groups** (`okta_group`) — departmental and app-access groups.
- **Applications** (`okta_app_oauth` OIDC web app, `okta_app_saml` SAML app) with group assignments.
- **A custom authorization server** (`okta_auth_server`) with scopes, claims, and an access policy.
- **Policies** — a password policy and an app sign-on / authenticator (MFA) policy.

It is parameterized so the same code deploys to `dev`, `test`, and `prod` from per-environment
variable files.

## Prerequisites

- **Terraform >= 1.6** (the provider is pinned to `~> 4.0`).
- An **Okta org** you control (e.g. `dev-123456.okta.com`, or a production org on `okta.com`
  / `ok, oktapreview.com`).
- An **API service account** with permission to manage the resources above. Two options:
  - **Recommended:** an OAuth 2.0 service app using **private-key JWT** (Okta calls this
    "API Services" / client-credentials with a signed JWT). No long-lived token to leak, and it can
    be scoped to only the Okta management API scopes the template needs.
  - **Simpler:** a classic **Okta API token** (SSWS). Easier to set up but a long-lived bearer
    credential — rotate it frequently and prefer the OAuth app for `prod`.

## Required secrets

Store these as **GitHub Actions secrets** (or in your secrets manager). The Terraform reads them via
`TF_VAR_*` environment variables — never commit them.

### Recommended: OAuth 2.0 service app (private-key JWT)

| Secret | Description | Example / notes |
|---|---|---|
| `OKTA_ORG_NAME` | Org subdomain (the part before the base URL) | `dev-123456` |
| `OKTA_BASE_URL` | Okta base domain | `okta.com` (or `oktapreview.com`) |
| `OKTA_API_CLIENT_ID` | Client ID of the API Services (OAuth) app | `0oaxxxxxxxxxxxxxx` |
| `OKTA_API_PRIVATE_KEY` | PEM-encoded private key for the app's JWK (RSA/EC) | multi-line PEM; store as a secret |
| `OKTA_API_SCOPES` | Comma-separated Okta management API scopes | `okta.groups.manage,okta.apps.manage,okta.authorizationServers.manage,okta.policies.manage` |

### Simpler alternative: API token

| Secret | Description | Example / notes |
|---|---|---|
| `OKTA_ORG_NAME` | Org subdomain | `dev-123456` |
| `OKTA_BASE_URL` | Okta base domain | `okta.com` |
| `OKTA_API_TOKEN` | SSWS API token | `00xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

> Provide **either** the OAuth set (`OKTA_API_CLIENT_ID` + `OKTA_API_PRIVATE_KEY` + `OKTA_API_SCOPES`)
> **or** `OKTA_API_TOKEN` — not both. The provider config in `providers.tf` picks up whichever
> variables are set.

## Directory layout

```
okta/
├── README.md                     # this file
├── terraform/
│   ├── versions.tf               # required_version + required_providers (okta ~> 4.0)
│   ├── providers.tf              # provider "okta" (OAuth JWT or API token, via variables)
│   ├── variables.tf              # org/auth/environment + app & group inputs
│   ├── groups.tf                 # okta_group resources
│   ├── apps.tf                   # okta_app_oauth + okta_app_saml + group assignments
│   ├── authorization_server.tf   # okta_auth_server + scope/claim/policy/rule
│   ├── policies.tf               # okta_policy_password + app sign-on / MFA policy
│   ├── backend.tf                # commented remote-state stub
│   ├── .gitignore                # ignores *.tfvars (keeps *.tfvars.example), state, .terraform/
│   └── env/
│       ├── dev.tfvars.example
│       └── prod.tfvars.example
└── workflows/
    └── deploy.yml                # copy to .github/workflows/deploy.yml in your IaC repo
```

## How to use

1. **Copy** the `okta/` folder into a dedicated IaC repository (keep identity config out of app repos).
2. **Set your variables.** Copy each `env/<env>.tfvars.example` to `env/<env>.tfvars` and edit the
   generic values. `env/*.tfvars` is gitignored; `env/*.tfvars.example` stays committed.
3. **Store secrets** (table above) as **GitHub Actions secrets** in your IaC repo. For `prod`, prefer
   the OAuth private-key-JWT service app over an API token.
4. **Copy the workflow.** Move `workflows/deploy.yml` to `.github/workflows/deploy.yml` in your repo.
5. **Open a PR** → the workflow runs `terraform fmt -check`, `init`, `validate`, and a read-only
   `plan` and posts it for review.
6. **Merge to `main`** → the workflow re-plans and `apply`s, gated by a protected `production`
   environment (manual approval).

Local usage mirrors CI:

```bash
cd terraform
export TF_VAR_org_name=dev-123456
export TF_VAR_base_url=okta.com
export TF_VAR_api_client_id=0oa...
export TF_VAR_api_private_key="$(cat okta-service-app.pem)"
export TF_VAR_api_scopes='okta.groups.manage,okta.apps.manage,okta.authorizationServers.manage,okta.policies.manage'
# or, instead of the three OAuth vars:  export TF_VAR_api_token=00...

terraform init
terraform plan  -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

## Multi-environment

Each environment is a separate `env/<env>.tfvars` file plus its own Terraform state (workspace or a
distinct backend key). **Never share one state across environments**, and use a **separate Okta org**
(or at minimum separate API credentials) per environment. The workflow selects the environment via a
matrix / input (`dev` on PRs, `prod` on merge to `main`).

## Safety notes

- **Blast radius.** Deleting an `okta_auth_server`, a policy, or an app has real impact on
  authentication. Review destroys in the plan carefully before approving an apply.
- **Least privilege.** Give the service app only the management scopes the template needs; rotate
  the private key / API token on a schedule.
- **Plan first, always.** PRs are read-only. Applies require review and a protected-environment
  approval.
- **No secrets in code.** Credentials come from `TF_VAR_*` env at run time; `*.tfvars` and state are
  gitignored.
- **Provider version.** Pinned to `okta ~> 4.0`; run `terraform init -upgrade` deliberately and
  re-plan when bumping.

## Parent

- Back to [parent](../README.md) — Identity Environment Templates (IaC) overview and shared conventions.
