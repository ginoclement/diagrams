---
title: "Microsoft Entra ID Environment Template (Terraform)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Microsoft Entra ID Environment Template (Terraform)

A copyable starter template for managing a **Microsoft Entra ID** tenant's configuration **as code**
with Terraform and the official [`hashicorp/azuread`](https://registry.terraform.io/providers/hashicorp/azuread/latest)
provider (v3.x). Fork this folder into a dedicated IaC repository, set your variables and secrets, and
use the included GitHub Actions workflow to plan on pull requests and apply on merge.

> This is a **starter template**, not a turn-key production config. Every value is generic and meant to
> be reviewed and adapted to your tenant. Always run `terraform plan` and read it before applying to a
> real Entra tenant. Nothing here contains real secrets.

## Overview

The Terraform in `terraform/` provisions a small, representative slice of an Entra ID tenant:

- **Security groups** (`azuread_group`) — assigned groups plus one **dynamic-membership** example
  driven by a membership rule.
- **An app registration** (`azuread_application`) with web redirect URIs, requested API permissions
  (Microsoft Graph), and **app roles**, plus its **service principal** (`azuread_service_principal`).
- **A Conditional Access policy** (`azuread_conditional_access_policy`) requiring **MFA** for all
  users, with a **break-glass exclusion group**.
- **A named location** (`azuread_named_location`) defining a trusted IP range.

It is parameterized so the same code deploys to `dev`, `test`, and `prod` from per-environment
variable files.

## Prerequisites

- **Terraform >= 1.6** (the provider is pinned to `~> 3.0`).
- An **Entra ID tenant** you control (its tenant ID, a GUID).
- A **service principal** (app registration) that Terraform authenticates as, granted the Microsoft
  Graph **application permissions (app roles)** needed to manage the resources above — typically
  `Application.ReadWrite.All`, `Group.ReadWrite.All`, `Policy.ReadWrite.ConditionalAccess`, and
  `Policy.Read.All` — with **admin consent** granted. Grant only what the template needs.

## Required secrets / auth

**Strongly recommended: GitHub OIDC → Entra workload identity federation.** Configure a **federated
credential** on the Terraform service principal that trusts your GitHub repo's OIDC token (subject
e.g. `repo:my-org/my-iac-repo:environment:production` / `:ref:refs/heads/main`). CI then exchanges its
short-lived GitHub OIDC token for an Entra access token — **no client secret is ever stored**.

| Secret / variable | Description | Example / notes |
|---|---|---|
| `AZURE_TENANT_ID` | Entra tenant ID (GUID) | `00000000-0000-0000-0000-000000000000` |
| `AZURE_CLIENT_ID` | Client (application) ID of the Terraform service principal | `11111111-1111-1111-1111-111111111111` |
| _(no client secret)_ | Auth is via federated credential + OIDC | `use_oidc = true` in `providers.tf` |

The provider reads these as `ARM_TENANT_ID` / `ARM_CLIENT_ID` (or the `tenant_id` / `client_id`
variables) and performs the token exchange when `use_oidc = true`.

### Client-secret fallback (not recommended)

If you cannot use federation, you may authenticate with a client secret instead. This is a long-lived
credential — rotate it frequently and prefer federation for `prod`.

| Secret | Description | Example / notes |
|---|---|---|
| `AZURE_TENANT_ID` | Entra tenant ID (GUID) | `00000000-0000-0000-0000-000000000000` |
| `AZURE_CLIENT_ID` | Client (application) ID | `11111111-1111-1111-1111-111111111111` |
| `AZURE_CLIENT_SECRET` | Client secret for the service principal | store as a secret; never commit; rotate often |

> Provide **either** OIDC federation (`AZURE_TENANT_ID` + `AZURE_CLIENT_ID`, `use_oidc = true`) **or**
> the client secret (`AZURE_CLIENT_SECRET`) — not both. Prefer federation.

## Directory layout

```
entra-id/
├── README.md                     # this file
├── terraform/
│   ├── versions.tf               # required_version + required_providers (azuread ~> 3.0)
│   ├── providers.tf              # provider "azuread" (OIDC: use_oidc + tenant_id/client_id)
│   ├── variables.tf              # tenant/auth/environment + group & app inputs
│   ├── groups.tf                 # azuread_group security groups (incl. dynamic membership)
│   ├── applications.tf           # azuread_application + service principal + optional password
│   ├── conditional_access.tf     # azuread_conditional_access_policy (MFA, break-glass exclusion)
│   ├── named_locations.tf        # azuread_named_location (trusted IP range)
│   ├── backend.tf                # commented azurerm remote-state stub
│   ├── .gitignore                # ignores *.tfvars (keeps *.tfvars.example), state, .terraform/
│   └── env/
│       ├── dev.tfvars.example
│       └── prod.tfvars.example
└── workflows/
    └── deploy.yml                # copy to .github/workflows/deploy.yml in your IaC repo
```

## How to use

1. **Copy** the `entra-id/` folder into a dedicated IaC repository (keep identity config out of app repos).
2. **Set your variables.** Copy each `env/<env>.tfvars.example` to `env/<env>.tfvars` and edit the
   generic values. `env/*.tfvars` is gitignored; `env/*.tfvars.example` stays committed.
3. **Configure federation.** Add a federated credential to the Terraform service principal that trusts
   your GitHub repo/environment, and store `AZURE_TENANT_ID` + `AZURE_CLIENT_ID` as **GitHub Actions
   secrets**. (Or, as a fallback, store `AZURE_CLIENT_SECRET`.)
4. **Copy the workflow.** Move `workflows/deploy.yml` to `.github/workflows/deploy.yml` in your repo.
5. **Open a PR** → the workflow runs `terraform fmt -check`, `init`, `validate`, and a read-only
   `plan` and posts it for review.
6. **Merge to `main`** → the workflow re-plans and `apply`s, gated by a protected `production`
   environment (manual approval).

Local usage mirrors CI (using the Azure CLI login for a developer):

```bash
cd terraform
az login --tenant 00000000-0000-0000-0000-000000000000   # developer sign-in
export ARM_TENANT_ID=00000000-0000-0000-0000-000000000000
export ARM_CLIENT_ID=11111111-1111-1111-1111-111111111111
# In CI, OIDC federation supplies the token (use_oidc = true); locally, az login is simplest.

terraform init
terraform plan  -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

## Multi-environment

Each environment is a separate `env/<env>.tfvars` file plus its own Terraform state (workspace or a
distinct backend key). **Never share one state across environments**, and use a **separate tenant**
(or at minimum a separate service principal / federated credential) per environment. The workflow
selects the environment via a matrix / input (`dev` on PRs, `prod` on merge to `main`).

## Safety notes

- **Conditional Access is high blast-radius.** A misconfigured CA policy can lock **every** admin out
  of the tenant. Always keep at least one **break-glass (emergency access) account** and **exclude it
  from every Conditional Access policy** — this template references a break-glass exclusion group on
  the MFA policy for exactly that reason. Validate CA changes in **report-only** mode before enforcing.
- **Break-glass accounts** are cloud-only, highly privileged, monitored, with long complex
  credentials stored offline; excluding them from CA prevents a policy or MFA outage from locking you
  out. Never manage their credentials in Terraform.
- **Blast radius.** Deleting an app registration / service principal, a CA policy, or a group has real
  impact on access. Review destroys in the plan carefully before approving an apply.
- **Least privilege.** Give the Terraform service principal only the Graph app roles the template
  needs; prefer federated credentials over client secrets and rotate any secret on a schedule.
- **Plan first, always.** PRs are read-only. Applies require review and a protected-environment approval.
- **No secrets in code.** Credentials come from OIDC federation (or `AZURE_CLIENT_SECRET`) at run time;
  `*.tfvars` and state are gitignored.
- **Provider version.** Pinned to `azuread ~> 3.0`; run `terraform init -upgrade` deliberately and
  re-plan when bumping.

## Parent

- Back to [parent](../README.md) — Identity Environment Templates (IaC) overview and shared conventions.
