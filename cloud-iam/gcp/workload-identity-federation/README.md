---
title: "Workload Identity Federation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Identity Federation

**Status:** 🔵 Emerging

## What it is

Keyless authentication for workloads that run **outside** Google Cloud — GitHub Actions, AWS,
Azure, on-prem OIDC/SAML IdPs — letting them access Google Cloud APIs without a downloadable
service account key. The external workload presents a credential its own IdP already issues
(an OIDC ID token, an AWS `GetCallerIdentity` signature, or a SAML assertion). Google's
**Security Token Service** (`sts.googleapis.com`) exchanges that external credential for a
short-lived **federated access token**, scoped to a `principal://` / `principalSet://` identity
derived from the token's claims. The workload then usually **impersonates a service account**
via `generateAccessToken` to get the final Google credential.

## When it is used

- CI/CD from GitHub Actions (`token.actions.githubusercontent.com`), GitLab, etc., deploying to GCP.
- Multi-cloud workloads on AWS/Azure needing GCP access without managing GCP keys.
- Anywhere you would otherwise download a service account JSON key — the recommended keyless
  replacement.

## Actors

| Actor | Role |
|---|---|
| Workload | External process (CI job, AWS/Azure VM) needing GCP access |
| ExtIdP | External identity provider issuing the OIDC/AWS/SAML credential |
| STS | Google Security Token Service (`sts.googleapis.com`) doing the token exchange |
| Pool | Workload Identity Pool + Provider defining trust and attribute mapping |
| IAMCreds | IAM Credentials API minting the impersonated SA access token |
| TargetSA | Service account the federated identity impersonates |

## Key mechanism details

- A **Workload Identity Pool** contains one or more **Providers**; each Provider pins the
  external issuer, allowed `audience`, and an **attribute mapping** (CEL) from external claims to
  Google attributes, e.g. `google.subject = assertion.sub`,
  `attribute.repository = assertion.repository`.
- `sts.googleapis.com/v1/token` with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`,
  `subject_token_type` (`urn:ietf:params:oauth:token-type:jwt` or `...:aws4_request`), and the
  external `subject_token`.
- The federated principal is
  `principalSet://iam.googleapis.com/projects/PN/locations/global/workloadIdentityPools/POOL/attribute.repository/ORG/REPO`
  and similar; SA impersonation is granted to that `principalSet://` member.
- **Provider conditions** (CEL `attribute_condition`) restrict which external tokens are accepted
  (e.g. only a specific repo, branch, or AWS account).

## Alternate scenarios covered

- Direct resource access to a federated identity (no SA impersonation) via `principalSet://` bindings.
- Attribute condition rejects the token (wrong repo/branch) → STS denies.
- AWS provider variant (signed `GetCallerIdentity` as the subject token).

## Security notes

- Scope the provider tightly: set an `attribute_condition` so only the intended repo/branch/account
  can federate — a missing condition trusts every token the issuer can mint.
- Always validate the `audience`; configure the external IdP to mint tokens with the specific
  Google audience so tokens cannot be replayed to other providers.
- Federated tokens are short-lived; combined with impersonation there is no long-lived key to leak.
- Enforce `iam.disableServiceAccountKeyCreation` so teams cannot fall back to keys.

## Related diagrams

- [Service Account Impersonation](../service-account-impersonation/README.md) — the second leg that mints the final SA token
- [GKE Workload Identity](../gke-workload-identity/README.md) — the in-cluster keyless equivalent
- [IAM Policy Evaluation](../iam-policy-evaluation/README.md) — how `principalSet://` members resolve
- [Entra Workload Identity Federation](../../entra/workload-identity-federation/README.md) — the Microsoft counterpart

## Files

- [sequence.md](sequence.md) — OIDC token exchange plus AWS and condition-reject alternates
- [swimlane.md](swimlane.md) — lanes for Workload, ExtIdP, STS, Pool, IAMCreds, TargetSA
- [flowchart.md](flowchart.md) — provider validation and attribute-mapping decisions
