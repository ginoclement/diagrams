---
title: "SailPoint ISC Environment Template (SP-Config)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SailPoint ISC Environment Template (SP-Config)

Infrastructure-as-Code template for **SailPoint Identity Security Cloud (ISC)** — formerly
IdentityNow. ISC has **no first-class Terraform provider**, so the idiomatic IaC approach is
**SP-Config**: exporting and importing tenant object JSON, driven by the **SailPoint CLI**
(`sail`) or the ISC **v3 REST API** with an OAuth client-credentials token.

[← Back to parent](../README.md)

> This is a **starter template**, not a turn-key production config. Every id, name, and value
> here is generic and clearly a placeholder. Review everything and run a dry-run/preview against a
> non-production tenant before importing. Nothing here contains real secrets.

## The SP-Config import/export model

ISC treats most configurable tenant objects — sources, identity profiles, transforms, access
profiles, roles, lifecycle states, and more — as JSON documents. SP-Config lets you:

- **Export** a tenant's objects to JSON (`sail spconfig export`, or
  `POST /v3/sp-config/export` → poll `GET /v3/sp-config/export/{id}` → download the result).
- **Import** those objects into another tenant (`sail spconfig import`, or
  `POST /v3/sp-config/import` with a ZIP bundle → poll `GET /v3/sp-config/import/status/{id}`).

Both operations are **asynchronous jobs**: you kick off the job, receive a job id, then poll for
status and download the result. Object references between files (a role pointing at an access
profile, an identity profile pointing at a source) are carried by id/name, so the objects in
`config/` cross-reference each other the same way a real export would.

Commit the exported JSON to Git and treat pull requests as your change-review surface — that is
what makes this "as code": the desired state of the tenant lives in version control, and the
pipeline reconciles a tenant to it.

## Prerequisites

- An ISC tenant and admin access to create an API client.
- **One of:**
  - a **Personal Access Token (PAT)** — created under *Preferences → Personal Access Tokens*;
    its id/secret act as `client_id`/`client_secret`, or
  - an **OAuth client** (client-credentials) with the scopes the template needs — at minimum
    `sp:scopes:all` for full SP-Config, or narrower `idn:*` scopes for the object types you touch.
- **One of:** the **SailPoint CLI** (`sail`) *or* plain `curl` (+ `zip`) — both paths are covered
  by `scripts/import.sh`.
- `node` (or `python3`) available in CI to validate JSON.

## Required secrets

Store these as CI secrets (GitHub Actions) or in a secrets manager — never in code:

| Secret | Example | Purpose |
|---|---|---|
| `SAIL_BASE_URL` | `https://TENANT.api.identitynow.com` | Tenant API base URL |
| `SAIL_CLIENT_ID` | `1a2b3c…` | OAuth / PAT client id |
| `SAIL_CLIENT_SECRET` | `••••••••` | OAuth / PAT client secret |

The `.api.identitynow.com` host is the API endpoint; the UI lives at
`https://TENANT.identitynow.com`. Use the **API** host for `SAIL_BASE_URL`.

## Directory layout

```
sailpoint-isc/
├── README.md                       # this file
├── config/                         # SP-Config object JSON (the desired tenant state)
│   ├── transforms/
│   │   ├── to-lower-email.json     # lower + concat transform
│   │   └── account-status.json     # static + conditional transform
│   ├── identity-profiles/
│   │   └── employee.json           # identity profile with attribute mappings
│   ├── sources/
│   │   └── delimited-file.json     # delimited/flat-file authoritative source
│   ├── access-profiles/
│   │   └── app-standard-access.json# access profile granting entitlements
│   ├── roles/
│   │   └── birthright-employee.json# role with membership criteria
│   └── lifecycle-states/
│       └── active.json             # lifecycle state (optional)
├── scripts/
│   └── import.sh                   # OAuth token + SP-Config import (with --dry-run)
└── workflows/
    └── deploy.yml                  # GitHub Actions template (copy to .github/workflows/)
```

## How to use

### Option A — SailPoint CLI (`sail`)

```sh
# Point the CLI at your tenant once (writes ~/.sailpoint/config.yaml):
sail configure   # prompts for base URL, client id, client secret

# Preview, then import the objects under config/:
sail spconfig import --dir ./config --dry-run
sail spconfig import --dir ./config
```

### Option B — REST API via the bundled script

`scripts/import.sh` obtains a token from `POST {SAIL_BASE_URL}/oauth/token` (client-credentials),
validates every JSON file, zips `config/` into an SP-Config bundle, and imports it via
`POST /v3/sp-config/import`. It prefers `sail` if installed and falls back to `curl`.

```sh
export SAIL_BASE_URL="https://TENANT.api.identitynow.com"
export SAIL_CLIENT_ID="…"
export SAIL_CLIENT_SECRET="…"

./scripts/import.sh --dry-run   # preview only — computes what WOULD change
./scripts/import.sh             # perform the import (async job; poll for status)
```

Under the hood the import call is roughly:

```sh
# 1. token
curl -X POST "$SAIL_BASE_URL/oauth/token" \
  -d grant_type=client_credentials \
  -d client_id=$SAIL_CLIENT_ID -d client_secret=$SAIL_CLIENT_SECRET

# 2. import a zip bundle of the config/ objects
curl -X POST "$SAIL_BASE_URL/v3/sp-config/import" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'options={"dryRun":true};type=application/json' \
  -F 'data=@spconfig-bundle.zip;type=application/zip'

# 3. poll
curl "$SAIL_BASE_URL/v3/sp-config/import/status/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Promotion between environments (dev → prod)

The canonical ISC promotion flow is **export from dev → review → import to prod**:

1. Build and validate config in a **dev** tenant.
2. **Export** dev's objects to JSON and commit them to a branch.
3. Open a **pull request**. CI validates JSON and runs a **dry-run import against prod** so
   reviewers see exactly what would change.
4. **Merge to `main`.** The push job imports into **prod**, gated by a protected `production`
   GitHub Environment (manual approval).

Keep a separate credential set per environment (different `SAIL_BASE_URL` / client per tenant) and
never share one across tenants. Object ids differ between tenants; SP-Config correlates primarily
by **name**, so keep names stable across environments.

## What the objects are

| Object | Role in ISC |
|---|---|
| **Source** | A connected system (here a delimited/flat file). An **authoritative** source feeds identity data; application sources hold accounts and entitlements. |
| **Transform** | A reusable, composable rule (`lower`, `concat`, `static`, `conditional`, `accountAttribute`, …) that shapes attribute values. Referenced by identity profiles and other transforms. |
| **Identity Profile** | Maps a source's account attributes to **identity attributes** and sets identity priority. Drives who is an "employee". |
| **Access Profile** | A requestable bundle of **entitlements on one source**, with request/revoke approval config. |
| **Role** | A higher-level grouping of access profiles, assigned by **membership criteria** (e.g. all active employees) or by request. Used for birthright/RBAC access. |
| **Lifecycle State** | A stage in an identity's lifecycle (active, leave, terminated) that drives account actions and access. |

## Safety notes

- **Import can create and overwrite.** SP-Config import will modify existing objects that match by
  id/name. Always run `--dry-run` (or `options.dryRun=true`) first and read the preview.
- Use import **`options`** (`includeTypes` / `excludeTypes`) to scope a run to the object types you
  intend to change, rather than importing everything by default.
- Deleting objects has **blast radius** — removing a source, identity profile, or role affects real
  people's access. SP-Config import does not delete objects that are simply absent from the bundle;
  handle removals deliberately and review them.
- Use a **dedicated, least-privilege** API client per environment and rotate the secret regularly.
- Placeholder ids like `00000000-0000-0000-0000-…` and `REPLACE_WITH_*` **must** be replaced (or
  correlated by name) before a real import.

## Alternative: community Terraform provider

A community **`terraform-provider-identitynow`** exists and lets you manage a subset of ISC objects
declaratively with Terraform. It is **not** an official SailPoint product and typically lags the
API surface that SP-Config covers. This template intentionally uses the SP-Config/CLI approach,
which SailPoint supports directly, but the community provider is a valid alternative if you prefer
Terraform's plan/apply model and only need the object types it implements.

## Related

- [← Parent: environment templates](../README.md)
