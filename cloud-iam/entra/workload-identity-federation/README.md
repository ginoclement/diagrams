---
title: "Entra Workload Identity Federation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Entra Workload Identity Federation

**Status:** ✅ Current

## What it is

Workload identity federation lets a workload running **outside** Azure — GitHub Actions, another
cloud, a Kubernetes cluster, any OIDC-capable system — obtain Microsoft Entra access tokens
**without a client secret**. Instead of storing an app-registration secret, you add a **federated
identity credential** to the Entra app that trusts an external OIDC issuer and pins the expected
`issuer`, `subject`, and `audience` claims. The external platform mints a short-lived OIDC token
describing the workload; the workload presents it to Entra's token endpoint as a
`client_assertion`, and Entra exchanges it for its own access token.

This is the OAuth 2.0 **client-credentials grant with a JWT assertion**
(`urn:ietf:params:oauth:client-assertion-type:jwt-bearer`), where the assertion is signed by the
external IdP rather than by a stored key.

## When it is used

- GitHub Actions deploying to Azure with no `AZURE_CLIENT_SECRET` in repo secrets.
- Workloads in AWS, GCP, or other clouds calling Entra-protected APIs.
- Kubernetes / GitLab / Terraform Cloud pipelines authenticating to Entra.
- Anywhere you want to eliminate long-lived, rotate-prone client secrets.

## Actors

| Actor | Role |
|---|---|
| Workload | External job (GitHub Actions runner, other-cloud process) needing an Entra token |
| ExtIdP | External OIDC issuer minting the workload assertion (e.g. GitHub OIDC provider) |
| Entra | Microsoft Entra token endpoint validating the assertion and issuing access tokens |
| API | Entra-protected resource the workload ultimately calls |

## Key details

- Federated identity credential on the Entra app pins: `issuer` (e.g.
  `https://token.actions.githubusercontent.com`), `subject` (e.g.
  `repo:org/repo:ref:refs/heads/main` or `:environment:prod`), and `audience` (default
  `api://AzureADTokenExchange`).
- Token request: `POST https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token` with
  `grant_type=client_credentials`, `client_id`, `scope=<resource>/.default`,
  `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, and
  `client_assertion=<external OIDC JWT>`.
- Entra fetches the external issuer's OIDC discovery + JWKS, verifies the assertion signature,
  and matches `iss`/`sub`/`aud` exactly against the federated credential.
- No secret or certificate is stored in Entra for this path — trust is entirely in the pinned
  claims and the external issuer's signing keys.
- Subject matching is exact; a build from a different branch, environment, or repo produces a
  different `sub` and is rejected.

## Alternate scenarios covered

- GitHub Actions happy path (`repo:org/repo:ref:refs/heads/main`).
- Federating another cloud's OIDC identity as the external issuer.
- Subject mismatch — a workflow on the wrong branch/environment is denied.
- Audience mismatch — the external token was minted for a different `aud`.

## Security notes

- Pin `subject` as tightly as possible (specific branch, tag, or `environment`); a loose subject
  like the whole repo lets any workflow in it mint tokens.
- Federation removes stored secrets entirely — the main remaining risk is a mis-scoped subject or
  a compromised external IdP signing key.
- The external assertion is short-lived and single-use in practice; Entra still issues its own
  standard access token bound to the app's permissions.
- Grant the Entra app least-privilege application permissions / RBAC on the target resources.

## Related diagrams

- [Managed identity via IMDS](../managed-identity-imds/README.md) — the equivalent no-secret pattern for workloads running inside Azure.
- [AssumeRoleWithWebIdentity (OIDC)](../../aws/assumerole-web-identity-oidc/README.md) — the AWS analog: federate an external OIDC identity into an AWS role.
- [GCP Workload Identity Federation](../../gcp/workload-identity-federation/README.md) — the GCP analog of the same pattern.

## Files

- [sequence.md](sequence.md) — external assertion minted, exchanged at the Entra token endpoint, with mismatch alternates.
- [swimlane.md](swimlane.md) — lanes for Workload, ExtIdP, Entra, API.
- [flowchart.md](flowchart.md) — the issuer/subject/audience matching gates with deny terminals.
