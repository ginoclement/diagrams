# GKE Workload Identity

**Status:** ✅ Current

## What it is

The recommended way for pods running in Google Kubernetes Engine to authenticate to Google
Cloud APIs without node-level keys or downloaded service account files. A **Kubernetes service
account (KSA)** is bound to a **Google service account (GSA)** (or, with the newer model, mapped
directly to an IAM `principal://` in the fleet Workload Identity Pool). Pods read credentials
from the **GKE metadata server** (a `gke-metadata-server` DaemonSet emulating
`169.254.169.254`), which uses the pod's **projected KSA token** to obtain short-lived GSA
access tokens via the Security Token Service and IAM Credentials API. No key ever lands in the
container.

## When it is used

- Any GKE workload that calls Google Cloud APIs (Cloud Storage, Pub/Sub, Secret Manager, ...).
- The replacement for exporting a service account JSON key into a pod as a secret.

## Actors

| Actor | Role |
|---|---|
| Pod | Application container using a client library / ADC |
| KSA | Kubernetes service account assigned to the pod, source of the projected token |
| Metadata | GKE metadata server intercepting `metadata.google.internal` requests |
| STS | Google Security Token Service exchanging the KSA token |
| IAMCreds | IAM Credentials API minting the GSA access token |
| GSA | Google service account whose permissions the pod ultimately uses |

## Key mechanism details

- Enable Workload Identity on the cluster/node pool; the fleet workload identity pool is
  `PROJECT_ID.svc.id.goog`.
- **Legacy binding**: annotate the KSA with `iam.gke.io/gcp-service-account=GSA_EMAIL` and grant
  the KSA member
  `serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/KSA_NAME]` the role
  `roles/iam.workloadIdentityUser` on the GSA.
- **Newer model**: bind IAM roles directly to the
  `principal://iam.googleapis.com/.../workloadIdentityPools/PROJECT.svc.id.goog/subject/ns/NS/sa/KSA`
  identity, no GSA needed.
- The pod's projected KSA token is a short-lived, audience-scoped JWT (mounted via a projected
  volume, auto-rotated by the kubelet). The metadata server exchanges it at STS, then calls
  `generateAccessToken` for the GSA.
- ADC in the pod finds credentials automatically at
  `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token`.

## Alternate scenarios covered

- Missing `workloadIdentityUser` binding → metadata server returns 403 → client library error.
- KSA not annotated / not mapped → default node SA is not used (Workload Identity blocks node-SA fallback).
- Direct `principal://` model (no intermediary GSA).

## Security notes

- Workload Identity removes the node's service account from pods, eliminating the node-key blast
  radius where every pod inherited the node SA.
- Scope each workload to its own KSA→GSA mapping for least privilege; do not share one GSA across
  unrelated workloads.
- Projected tokens are short-lived and audience-bound, limiting replay; the kubelet rotates them.
- Restrict the pool binding to the exact `NAMESPACE/KSA_NAME` — a wildcard would let any pod
  impersonate the GSA.

## Related diagrams

- [Workload Identity Federation](../workload-identity-federation/README.md) — the same STS exchange for non-GKE external workloads
- [Service Account Impersonation](../service-account-impersonation/README.md) — the `generateAccessToken` leg used internally
- [Application Default Credentials](../application-default-credentials/README.md) — how the pod's library finds the metadata server
- Entra Managed Identity (IMDS) *(planned)* — Azure's metadata-server analogue

## Files

- [sequence.md](sequence.md) — projected-token exchange happy path plus binding-missing alternates
- [swimlane.md](swimlane.md) — lanes for Pod, KSA, Metadata, STS, IAMCreds, GSA
- [flowchart.md](flowchart.md) — annotation and binding decision tree with error terminals
