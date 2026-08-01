---
title: "Auth0 Environment Template (Terraform)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Auth0 Environment Template (Terraform)

A copyable starter for managing an **Auth0 (Customer Identity — CIAM)** tenant's configuration
**as code** with Terraform and the official [`auth0/auth0`](https://registry.terraform.io/providers/auth0/auth0/latest)
provider (v1.x). It provisions a tenant's core objects — tenant settings, applications
(clients), APIs (resource servers), connections, actions, and roles — and ships a GitHub Actions
workflow to plan on pull requests and apply on merge.

> This is a **starter template**, not a turn-key production config. Every value is generic and
> meant to be reviewed and adapted to your tenant. Always run `terraform plan` and read it before
> applying to a real tenant. **Nothing here contains real secrets.**

See the [parent overview](../README.md) for the conventions shared across all identity
environment templates.

## Overview

The Terraform in [`terraform/`](terraform/) is split by concern so each file is easy to copy,
diff, and review:

| File | What it manages |
|---|---|
| `versions.tf` | Terraform + provider version constraints (`auth0 ~> 1.0`) |
| `providers.tf` | `auth0` provider config (domain + M2M client credentials) |
| `variables.tf` | Input variables (credentials, environment name, tunables) |
| `tenant.tf` | `auth0_tenant` — friendly name, session/idle lifetimes, flags |
| `clients.tf` | `auth0_client` (SPA + regular web app) and `auth0_client_grant` |
| `resource_servers.tf` | `auth0_resource_server` (API) + `auth0_resource_server_scopes` |
| `connections.tf` | `auth0_connection` (database + social) + `auth0_connection_clients` |
| `actions.tf` | `auth0_action` (post-login custom claim) + `auth0_trigger_actions` |
| `roles.tf` | `auth0_role` with permissions |
| `backend.tf` | Commented remote-state stub |
| `env/*.tfvars.example` | Per-environment variable examples (`dev`, `prod`) |

## Prerequisites

- **Terraform >= 1.6** (or OpenTofu >= 1.6).
- An **Auth0 tenant** (one per environment — see [Multi-environment](#multi-environment) below).
- A **Machine-to-Machine (M2M) application** in that tenant, **authorized for the Auth0
  Management API** (`https://YOUR_DOMAIN/api/v2/`) with the scopes the template needs — at minimum
  `read:*` / `create:*` / `update:*` / `delete:*` on `clients`, `client_grants`,
  `resource_servers`, `connections`, `actions`, `roles`, and `tenant_settings`. Grant only the
  scopes you actually manage.

Create the M2M app manually (or via the Auth0 dashboard / Deploy CLI) **once per tenant** — it is
the credential Terraform uses to manage everything else, so it should not manage itself.

## Required secrets

Terraform authenticates to the Management API with these three values. Provide them as
**environment variables** in CI (`TF_VAR_auth0_domain`, `TF_VAR_auth0_client_id`,
`TF_VAR_auth0_client_secret`) or via a secrets manager — **never** commit them.

| Secret | Description | Example |
|---|---|---|
| `AUTH0_DOMAIN` | Your tenant's canonical domain | `your-tenant.us.auth0.com` |
| `AUTH0_CLIENT_ID` | Client ID of the M2M app authorized for the Management API | `abc123...` |
| `AUTH0_CLIENT_SECRET` | Client secret of that M2M app (**sensitive**) | `super-secret...` |

The workflow maps GitHub Actions secrets of these names to `TF_VAR_*` at run time.

## Directory layout

```
auth0/
├── README.md                     # this file
├── terraform/
│   ├── versions.tf               # terraform + provider constraints
│   ├── providers.tf              # auth0 provider config
│   ├── variables.tf              # input variables
│   ├── tenant.tf                 # auth0_tenant
│   ├── clients.tf                # auth0_client + auth0_client_grant
│   ├── resource_servers.tf       # auth0_resource_server + scopes
│   ├── connections.tf            # auth0_connection + auth0_connection_clients
│   ├── actions.tf                # auth0_action + auth0_trigger_actions
│   ├── roles.tf                  # auth0_role
│   ├── backend.tf                # commented remote-state stub
│   ├── .gitignore                # ignores state + real *.tfvars
│   └── env/
│       ├── dev.tfvars.example
│       └── prod.tfvars.example
└── workflows/
    └── deploy.yml                # copy into .github/workflows/ of your IaC repo
```

## How to use

1. Copy the `auth0/` folder into a **dedicated IaC repository** (keep identity config out of app
   repos).
2. Copy `workflows/deploy.yml` to `.github/workflows/deploy.yml` in that repo.
3. Configure remote state: edit `terraform/backend.tf` and uncomment/point it at your backend
   (S3 + DynamoDB, Azure Storage, GCS, or Terraform Cloud). Never commit local state.
4. Create a per-environment tfvars file from the examples:
   ```bash
   cd terraform
   cp env/dev.tfvars.example env/dev.tfvars    # then edit — this file is gitignored
   ```
5. Store the three required secrets as **GitHub Actions secrets** (`AUTH0_DOMAIN`,
   `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`) in your IaC repo.
6. Run locally against a **non-prod** tenant first:
   ```bash
   export TF_VAR_auth0_domain="your-dev-tenant.us.auth0.com"
   export TF_VAR_auth0_client_id="..."
   export TF_VAR_auth0_client_secret="..."

   terraform init
   terraform plan  -var-file=env/dev.tfvars
   terraform apply -var-file=env/dev.tfvars
   ```
7. Open a PR → the workflow runs `fmt` / `init` / `validate` / `plan`.
8. Merge to the default branch → the workflow **applies**, gated by a protected `production`
   environment (manual approval).

## Multi-environment

**Auth0 best practice is one tenant per environment** — a separate `dev`, `test`/`staging`, and
`prod` tenant, each with its own domain and its own M2M app. Auth0 does not have namespaces within
a tenant, so isolating by tenant is the supported way to keep environments from colliding.

Consequently:

- Keep a **separate Terraform state per tenant** (separate backend key or workspace).
- Keep a **separate tfvars file per environment** (`env/dev.tfvars`, `env/prod.tfvars`) and pass
  it with `-var-file`.
- Provide **that tenant's** `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` at run
  time — the same code applies to any tenant; only the credentials and variables change.

Never point the same state at two tenants, and never share one M2M credential across environments.

## Safety notes

- **Blast radius.** Deleting a connection, resource server, or client in a live CIAM tenant can
  lock users out or break token issuance. Review every `terraform plan` — especially `-/+`
  (replace) and `-` (destroy) lines — before applying.
- **Secrets.** `auth0_client` exposes a `client_secret` attribute; it is marked sensitive here and
  must never be printed to logs or committed. Treat state as sensitive (it stores these values) —
  encrypt remote state and restrict access.
- **Least privilege + rotation.** Give the M2M app only the Management API scopes this template
  needs and rotate its secret on a schedule.
- **Drift.** Changes made by hand in the Auth0 dashboard drift from code. Prefer changing config
  in Terraform; run a periodic `plan` to detect drift.
- **Rate limits.** The Management API is rate-limited; large applies may need retries.

## Alternative: Auth0 Deploy CLI (a0deploy)

Auth0 also offers the **[Auth0 Deploy CLI](https://auth0.com/docs/deploy-monitor/deploy-cli-tool)**
(`a0deploy`), which exports/imports a tenant's configuration as YAML or JSON directory bundles. It
is a first-party, config-file-driven alternative to Terraform that some teams prefer for full-tenant
export/import and promotion between tenants. Terraform (this template) gives you a declarative
resource graph, plan/apply review, and state; `a0deploy` gives you a snapshot-style config bundle.
Pick one approach per tenant and stick with it to avoid two tools fighting over the same objects.

---

Back to the [parent overview](../README.md).
