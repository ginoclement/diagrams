# Azure Managed Identity via IMDS

**Status:** ✅ Current

## What it is

A **managed identity** gives an Azure resource (VM, App Service, Function, AKS pod,
Container App) an Entra ID service principal **without any secret in code or config**. The
platform manages the credential. Code running on the resource asks the local **Instance
Metadata Service (IMDS)** — a non-routable endpoint at `http://169.254.169.254/metadata/identity/oauth2/token`
(App Service/Functions use the `IDENTITY_ENDPOINT` + `IDENTITY_HEADER` variant) — for an
access token scoped to a target resource (e.g. `resource=https://storage.azure.com`). IMDS,
via the Azure fabric, authenticates to Entra and returns a bearer **access token** (a JWT
whose `oid`/`sub` is the managed identity). The app presents that token to the target
Azure service, which authorizes via Azure RBAC.

Two kinds:

- **System-assigned** — tied 1:1 to the resource lifecycle; deleted with it.
- **User-assigned** — a standalone identity resource that can be attached to many resources;
  callers must pass `client_id` (or `mi_res_id`) to disambiguate when several are attached.

## When it is used

- Any Azure-hosted workload that needs to call Azure services (Key Vault, Storage, SQL,
  Graph) without managing secrets.
- The recommended replacement for connection strings and app-registration client secrets on
  Azure compute.

## Actors

| Actor | Role |
|---|---|
| App | Workload code running on the Azure resource |
| IMDS | Local Instance Metadata Service / identity endpoint on the host |
| Fabric | Azure platform that holds and rotates the managed-identity credential |
| Entra | Entra ID token endpoint issuing the access token |
| Target | Azure resource / API the token is used against (authorized by RBAC) |

## Alternate scenarios covered

- System-assigned identity (no `client_id` needed).
- User-assigned identity (`client_id` / `mi_res_id` selects which).
- Multiple user-assigned identities attached — disambiguation required.
- Token cache hit (IMDS returns a still-valid cached token).
- RBAC not granted on the target → token valid but authorization denied.
- IMDS unreachable / identity not configured → acquisition fails.

## Security notes

- No secret ever lives in code, config, or environment for the identity itself — the
  fabric holds and rotates the underlying credential.
- IMDS is only reachable from **on the instance**; protect against SSRF that could trick a
  vulnerable app into proxying IMDS token requests (a real attack class — restrict outbound
  and validate URLs; on some platforms require the `Metadata: true` header).
- Grant least-privilege Azure RBAC to the identity; a token is only as powerful as the role
  assignments on the target.
- Prefer managed identity over [Workload Identity Federation](../workload-identity-federation/README.md)
  when the workload runs on Azure; use federation when it runs outside Azure.

## Related diagrams

- [Workload Identity Federation](../workload-identity-federation/README.md) — secretless identity for workloads outside Azure
- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — CA for workload identities gating token issuance
- [OAuth2 Client Credentials](../../../oidc/client-credentials/README.md) — the app-only grant managed identity replaces the secret for
- [Kubernetes workload identity](../../../workload-identity/kubernetes-service-account/README.md) — the AKS federation counterpart

## Files

- [sequence.md](sequence.md) — IMDS token request, system vs user-assigned, and failure alternates
- [swimlane.md](swimlane.md) — lanes for App, IMDS, Fabric, Entra, Target
- [flowchart.md](flowchart.md) — identity selection, token acquisition, and RBAC gates
