# Service Account Impersonation

**Status:** ✅ Current

## What it is

A principal (a user, or another service account) obtains short-lived credentials **for** a
target service account without ever holding that account's private key. The caller must hold
the **Service Account Token Creator** role (`roles/iam.serviceAccountTokenCreator`) on the
target service account, then calls the IAM Credentials API — `generateAccessToken` for an
OAuth 2.0 access token, or `generateIdToken` for an OIDC ID token — and receives a credential
that expires (up to 1 hour for access tokens, or 12 hours if the org policy allows). A
**delegation chain** (`delegates[]`) lets impersonation hop through intermediate service
accounts, each of which must grant Token Creator to the previous hop.

## When it is used

- A developer or CI job needs a service account's permissions temporarily, without downloading
  a JSON key.
- Cross-service or cross-project access where one identity acts as another with least privilege.
- The recommended replacement for **downloadable service account keys**, which are long-lived
  secrets prone to leakage.

## Actors

| Actor | Role |
|---|---|
| Caller | The principal doing the impersonation (user or source service account) |
| IAMCreds | IAM Credentials API (`iamcredentials.googleapis.com`) issuing short-lived tokens |
| IAM | Cloud IAM checking `roles/iam.serviceAccountTokenCreator` on the target |
| TargetSA | The service account being impersonated |
| API | The Google Cloud API the borrowed token is finally used against |

## Key API details

- `projects.serviceAccounts.generateAccessToken` → `{ accessToken, expireTime }`, with a
  requested `scope[]` and `lifetime` (default 1h, max 12h with
  `constraints/iam.allowServiceAccountCredentialLifetimeExtension`).
- `projects.serviceAccounts.generateIdToken` → a signed OIDC ID token with a caller-chosen
  `audience`, used to authenticate to Cloud Run, IAP, or other OIDC-aware backends.
- `signBlob` / `signJwt` are related IAM Credentials methods for signing with the SA's key.
- Delegation: `delegates` lists intermediate SAs in order; each must have Token Creator on the
  next, and the final caller-to-first-delegate edge must also hold it.

## Alternate scenarios covered

- Missing Token Creator role → `403 PERMISSION_DENIED`.
- Delegation chain where one hop lacks the role → whole chain fails.
- `generateIdToken` for calling an OIDC backend (Cloud Run / IAP) instead of an access token.

## Deprecated alternative

- **Downloadable service account keys** (`serviceAccounts.keys.create`, JSON key files) are
  **⛔ Deprecated practice**: they are long-lived, non-expiring secrets that are frequently
  committed to source control or leaked. Prefer impersonation or
  [Workload Identity Federation](../workload-identity-federation/README.md). Enforce the
  `iam.disableServiceAccountKeyCreation` org policy to block key creation entirely.

## Security notes

- Token Creator is a powerful grant — it is effectively "act as this SA"; audit holders and
  scope grants to individual service accounts, never at the project level broadly.
- Short lifetimes shrink the exposure window; do not extend to 12h without justification.
- Impersonation calls are logged in Cloud Audit Logs (`generateAccessToken`), giving a clear
  actor → impersonated-SA trail that key files do not.
- Avoid deep delegation chains; each hop is another trust edge to audit.

## Related diagrams

- [Workload Identity Federation](../workload-identity-federation/README.md) — keyless external-identity path to impersonation
- [Application Default Credentials](../application-default-credentials/README.md) — how libraries pick up an impersonation config
- [IAM Policy Evaluation](../iam-policy-evaluation/README.md) — how the Token Creator grant is resolved
- Entra Managed Identity (IMDS) *(planned)* — the Azure analogue of keyless workload creds

## Files

- [sequence.md](sequence.md) — generateAccessToken happy path plus delegation and ID-token alternates
- [swimlane.md](swimlane.md) — lanes for Caller, IAMCreds, IAM, TargetSA, API
- [flowchart.md](flowchart.md) — Token Creator checks and error terminals
