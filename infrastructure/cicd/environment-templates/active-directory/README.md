---
title: "Active Directory Baseline Template (PowerShell)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Active Directory Baseline Template (PowerShell)

A copyable starter template for configuring an **existing on-prem Active Directory
domain**'s baseline **as code** using idempotent PowerShell (the `ActiveDirectory`
RSAT module), deployed through a **self-hosted GitHub Actions runner** with domain
access. Fork this folder into a dedicated IaC repository, set your inputs and
secrets, and use the included workflow to preview (`-WhatIf`) on pull requests and
apply on merge.

> This is a **starter template**, not a turn-key production config. Every value is
> generic and meant to be reviewed and adapted to your domain. Always run with
> **`-WhatIf` first** and read the preview before applying to a real domain.
> Nothing here contains real secrets.

## Overview

Unlike the other platforms in this directory, Active Directory cannot be fully
created by a declarative provider: **there is no Terraform "forest bootstrap"**.
Standing up the directory itself is an imperative, stateful operation.

**What this template DOES** (against a domain that already exists):

- Creates a **tiered OU structure** following Microsoft's tiered administration
  model — `OU=Admin` with `Tier0` / `Tier1` / `Tier2` sub-trees, plus top-level
  `Users`, `Workstations`, `Servers`, `Groups`, and `ServiceAccounts` OUs.
- Creates **core security groups**, including per-tier admin groups
  (`Tier0-Admins`, `Tier1-Admins`, `Tier2-Admins`).
- Creates a **fine-grained password policy (PSO)** via
  `New-ADFineGrainedPasswordPolicy` and applies it to a service-account group.
- Creates an example **group Managed Service Account (gMSA)** via
  `New-ADServiceAccount`.

Everything is **idempotent** (create-if-missing via `Get-ADObject` / guarded
lookups), so the script converges on the same state on every run.

**What this template does NOT do:**

- It does **not** stand up a forest or **promote a domain controller**. There is
  no `Install-ADDSForest` / `Install-ADDSDomainController` here.
- It does **not** provision the DC infrastructure (VMs, disks, networking). That
  is a separate concern: provision the DC host(s) with Terraform
  (`azurerm_windows_virtual_machine` / `aws_instance`, etc.) and then run a
  **promotion step** (a PowerShell / DSC bootstrap that calls
  `Install-ADDSForest` or joins a replica DC). Only **after** the forest exists
  does this baseline template apply.

In short: infrastructure + forest promotion first (elsewhere), **then** this
baseline configures the running domain.

## Prerequisites

- A **self-hosted GitHub Actions runner** on **Windows**, either **domain-joined**
  to (or otherwise able to reach) the target domain and its AD Web Services
  endpoint (TCP 9389) and LDAP (389/636). GitHub-hosted runners cannot reach an
  on-prem domain and will not work.
- **RSAT / the `ActiveDirectory` PowerShell module** installed on the runner
  (`Install-WindowsFeature RSAT-AD-PowerShell` on Windows Server, or the RSAT
  optional feature on client OS).
- An **account with delegated rights** to create the objects above (create OUs,
  groups, PSOs, and service accounts in the target OUs). Prefer a delegated,
  tier-appropriate account over Domain Admin.
- For the gMSA: a **KDS root key** must exist in the forest (one-time,
  `Add-KdsRootKey`; in production it becomes usable ~10 hours after creation).
  The script warns and defers gMSA creation if the key is missing.

## Required inputs / secrets

Configuration inputs are stored as **GitHub Actions variables**; credentials (if
used) as **GitHub Actions secrets**. Never commit them.

| Name | Kind | Description | Example |
|---|---|---|---|
| `AD_DOMAIN_DN` | variable | Target domain naming context (distinguished name) | `DC=corp,DC=example,DC=com` |
| `AD_TARGET_DC` | variable | Target domain controller / ADWS endpoint FQDN (optional; auto-discovered if unset) | `dc01.corp.example.com` |

Then choose **one** credential model:

| Option | Name(s) | Kind | Notes |
|---|---|---|---|
| **Recommended: gMSA runner identity** | *(none)* | — | The runner service logs on as a **gMSA** with delegated rights. No secret to store or rotate; the script omits `-Credential` and uses the runner's own identity. |
| **Alternative: AD_ADMIN credential** | `AD_ADMIN_USER`, `AD_ADMIN_PASSWORD` | secret | A delegated account's `DOMAIN\user` + password. The workflow builds a `[PSCredential]` at run time and passes it via `-Credential`. Rotate frequently. |

> Provide **either** the gMSA runner identity (no secrets) **or** the
> `AD_ADMIN_USER` + `AD_ADMIN_PASSWORD` secrets — not both. The workflow only
> builds a `[PSCredential]` when the secrets are present.

## Directory layout

```
active-directory/
├── README.md                       # this file
├── powershell/
│   ├── Deploy-ADBaseline.ps1       # idempotent baseline script (supports -WhatIf)
│   └── config/
│       └── baseline.psd1           # data file: OUs, groups, PSO, gMSA (generic)
└── workflows/
    └── deploy.yml                  # copy to .github/workflows/deploy.yml
```

## How to use

1. **Copy** the `active-directory/` folder into a dedicated IaC repository (keep
   identity config out of app repos).
2. **Edit `powershell/config/baseline.psd1`** to match your domain — OU names,
   group names, PSO thresholds, gMSA name and DNS host name. All values ship as
   generic placeholders.
3. **Set variables** `AD_DOMAIN_DN` (and optionally `AD_TARGET_DC`) in your repo,
   and — only if not using a gMSA runner — the `AD_ADMIN_USER` /
   `AD_ADMIN_PASSWORD` **secrets**.
4. **Copy the workflow.** Move `workflows/deploy.yml` to
   `.github/workflows/deploy.yml`. Ensure a runner labelled
   `[self-hosted, windows, ad]` is online with the `ActiveDirectory` module.
5. **Open a PR** → the workflow runs the script with **`-WhatIf`** (preview only,
   no changes) and posts the output for review.
6. **Merge to `main`** → the workflow runs the script **for real**, gated by a
   protected `production` environment (manual approval).

Local usage mirrors CI (run from the `active-directory/` folder):

```powershell
# Preview only - makes NO changes:
./powershell/Deploy-ADBaseline.ps1 -DomainDN 'DC=corp,DC=example,DC=com' -WhatIf -Verbose

# Apply for real against a specific DC:
./powershell/Deploy-ADBaseline.ps1 -DomainDN 'DC=corp,DC=example,DC=com' -Server dc01.corp.example.com
```

## Multi-environment via `env/*.psd1`

Keep one data file per environment and pass it with `-ConfigPath`, e.g.
`powershell/config/env/dev.psd1`, `powershell/config/env/prod.psd1`. Each file
carries that environment's OU names, PSO thresholds and gMSA name; the script is
identical across environments. **Never point one run at more than one domain**,
and use a **separate domain / forest (or at least separate credentials)** per
environment. In CI, select the file per branch (e.g. `dev.psd1` on PRs,
`prod.psd1` on merge to `main`):

```powershell
./powershell/Deploy-ADBaseline.ps1 -DomainDN $env:AD_DOMAIN_DN -ConfigPath ./powershell/config/env/prod.psd1
```

## Safety notes

- **Run with `-WhatIf` first, always.** The script uses
  `[CmdletBinding(SupportsShouldProcess)]`, so `-WhatIf` previews every change and
  makes none. PRs run in this mode; read the preview before merging.
- **Follow the tiering model.** Tier 0 = identity control plane (DCs, PKI, domain
  admins); Tier 1 = servers; Tier 2 = workstations/helpdesk. **Never log a Tier 0
  credential onto a Tier 1/2 host.** Scope logon rights, delegation and GPOs per
  tier. Keep `Tier0-Admins` membership minimal and audited.
- **Protect break-glass accounts.** Maintain emergency-access (break-glass)
  domain accounts that are **excluded from automation**, stored offline, MFA/
  physically protected, and alerted on any use. Do not manage them with this
  pipeline.
- **Least privilege.** Delegate only the rights the baseline needs on the target
  OUs; prefer a gMSA runner identity over a stored admin credential. Rotate any
  `AD_ADMIN` secret on a schedule.
- **Blast radius.** OUs are created `ProtectedFromAccidentalDeletion`. Review any
  change to groups or the PSO carefully — a mis-scoped PSO or admin group affects
  authentication and privilege.
- **No secrets in code.** Credentials come from CI secrets (or the runner's gMSA
  identity) at run time; the config file holds only non-secret structure.

## Alternative: PowerShell DSC

This template uses **imperative idempotent PowerShell** because it is easy to read
and debug. A **declarative** alternative is **PowerShell DSC** with the community
[`ActiveDirectoryDsc`](https://github.com/dsccommunity/ActiveDirectoryDsc)
resources (`ADOrganizationalUnit`, `ADGroup`, `ADFineGrainedPasswordPolicy`,
`ADManagedServiceAccount`, etc.). DSC expresses the same baseline as desired
state and can continuously enforce it via a pull server or Azure Automanage
Machine Configuration. Either approach is valid; DSC trades the script's
step-by-step clarity for continuous drift correction.

## Parent

- Back to [parent](../README.md) — Identity Environment Templates (IaC) overview
  and shared conventions.
