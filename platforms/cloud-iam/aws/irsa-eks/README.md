---
title: "IRSA — IAM Roles for Service Accounts (EKS)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IRSA — IAM Roles for Service Accounts (EKS)

**Status:** ✅ Current

Gives a Kubernetes pod on Amazon EKS temporary AWS credentials scoped to an IAM role,
**without** any long-lived access key. The pod presents a projected, audience-bound
ServiceAccount token (a signed OIDC JWT) to AWS STS via `AssumeRoleWithWebIdentity`; the
role's trust policy pins the cluster's OIDC provider and the specific
`system:serviceaccount:<namespace>:<name>` subject.

## When it is used

- Workloads on EKS that call AWS APIs and should use least-privilege, short-lived credentials.
- Replacing node-instance-profile credential sharing (where every pod on a node inherited the
  same role) with per-ServiceAccount roles.

## Actors

| Actor | Role |
|---|---|
| `Pod` | Application container using an AWS SDK |
| `SA` | Kubernetes ServiceAccount annotated with `eks.amazonaws.com/role-arn` |
| `Webhook` | EKS Pod Identity Webhook that injects env vars and the projected token volume |
| `Kubelet` | Projects and rotates the ServiceAccount token on the pod |
| `OIDC` | The cluster's IAM OIDC provider (public JWKS for the EKS issuer) |
| `STS` | AWS Security Token Service |

## Alternate scenarios covered

- Token rotation / expiry — the SDK re-reads the projected token file as the kubelet refreshes it.
- Trust-policy `sub`/`aud` mismatch → STS denies.
- EKS Pod Identity (the newer alternative that does not use the OIDC provider).
- Missing IAM OIDC provider for the cluster → association required first.

## Security notes

- The trust policy must pin **both** `<oidc>:aud = sts.amazonaws.com` and
  `<oidc>:sub = system:serviceaccount:<ns>:<sa>`. Pinning only the audience lets **any**
  ServiceAccount in the cluster assume the role.
- Projected tokens are audience-scoped and short-lived (default ~1 hour, rotated), which
  limits replay compared to static keys.
- Grant the assumed role least privilege; IRSA does not by itself constrain what the role can do.

## Related diagrams

- [AssumeRoleWithWebIdentity (OIDC federation)](../assumerole-web-identity-oidc/README.md)
- [STS AssumeRole](../sts-assumerole/README.md)
- [Kubernetes ServiceAccount token](../../../../workload-identity/kubernetes-serviceaccount-token/README.md)
- [Workload identity federation (generic)](../../../../workload-identity/workload-identity-federation-generic/README.md)

## Files

- [`sequence.md`](./sequence.md)
- [`swimlane.md`](./swimlane.md)
- [`flowchart.md`](./flowchart.md)
