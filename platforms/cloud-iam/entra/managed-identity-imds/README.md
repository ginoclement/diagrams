---
title: "Azure Managed Identity via IMDS"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Azure Managed Identity via IMDS

**Status:** ✅ Current

## What it is

A **managed identity** gives an Azure resource (VM, VMSS, App Service, Container App, etc.) an
identity in Microsoft Entra ID without any credentials to store or rotate. Code on the resource
asks the local **Azure Instance Metadata Service (IMDS)** token endpoint for an OAuth 2.0 access
token, scoped to a target resource (Azure Resource Manager, Key Vault, Storage, Graph). The
platform manages the underlying service-principal credential; the app only ever sees short-lived
bearer tokens.

Two flavors exist:

- **System-assigned** — tied 1:1 to the resource lifecycle, deleted with it. The IMDS call needs
  only the `resource` parameter.
- **User-assigned** — a standalone Entra object that can be attached to many resources. The IMDS
  call must disambiguate which identity via `client_id`, `object_id`, or `mi_res_id`.

## When it is used

- Any Azure-hosted workload calling Azure or Entra-protected APIs (Key Vault secrets, Storage,
  ARM, Microsoft Graph) without embedding secrets.
- The default credential path for the Azure SDKs and `DefaultAzureCredential`.
- Preferred over app-registration client secrets for anything running inside Azure.

## Actors

| Actor | Role |
|---|---|
| App | Process on the Azure resource requesting a token from IMDS |
| IMDS | Link-local Azure metadata token endpoint at 169.254.169.254 |
| Entra | Microsoft Entra ID issuing the access token for the managed identity |
| API | Azure/Entra-protected resource the bearer token is sent to |

## Key details

- Endpoint (VM/VMSS): `GET http://169.254.169.254/metadata/identity/oauth2/token`
  `?api-version=2018-02-01&resource=<resource-uri>` with header `Metadata: true`.
- `resource` is an App ID URI, e.g. `https://vault.azure.net`, `https://management.azure.com/`,
  `https://storage.azure.com/`, `https://graph.microsoft.com`.
- User-assigned disambiguation: add one of `client_id=<guid>`, `object_id=<guid>`, or
  `mi_res_id=<full-resource-id>`.
- App Service / Functions / Container Apps use `IDENTITY_ENDPOINT` + `IDENTITY_HEADER` (an
  `X-IDENTITY-HEADER` secret) instead of the 169.254.169.254 address, same token shape.
- Response: JSON with `access_token` (a JWT), `token_type: Bearer`, `expires_in`, `resource`.
- The token is a standard Entra v1/v2 access token, validated by the API against Entra's JWKS.

## Alternate scenarios covered

- System-assigned happy path (no identity parameter needed).
- User-assigned identity selected by `client_id` (and the ambiguity error when two are attached
  and none is specified).
- App Service / Functions variant using `IDENTITY_ENDPOINT` + `X-IDENTITY-HEADER`.
- Missing `Metadata: true` header rejected to blunt SSRF against the token endpoint.

## Security notes

- IMDS requires the `Metadata: true` header and rejects requests with an `X-Forwarded-For`
  header, which blunts naive SSRF against the token endpoint — but scope network egress anyway.
- User-assigned identities shared across resources widen blast radius; prefer per-workload
  identities and least-privilege role assignments.
- Tokens are bearer tokens — anything that can read them from the resource can use them until
  `expires_in`; they cannot be revoked individually before expiry.
- Assign the identity only the RBAC roles it needs on the specific target resources.

## Related diagrams

- [Workload identity federation (Entra)](../workload-identity-federation/README.md) — the no-secret pattern for workloads running outside Azure.
- [Primary Refresh Token](../primary-refresh-token/README.md) — the device-bound token model for interactive Entra sessions.
- [Conditional Access evaluation](../conditional-access-evaluation/README.md) — policy checks that can also gate workload token issuance.

## Files

- [sequence.md](./sequence.md) — IMDS token request and API call, with user-assigned and App Service alternates.
- [swimlane.md](./swimlane.md) — lanes for App, IMDS, Entra, API.
- [flowchart.md](./flowchart.md) — identity-selection and header decision gates with error terminals.
