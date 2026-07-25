---
title: "CI/CD Security and Delivery"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# CI/CD Security and Delivery

Continuous integration and continuous delivery (CI/CD) is where source code becomes a
running system. That pipeline is also one of the highest-value targets in a modern
software supply chain: whoever can change what the pipeline runs, or what credentials it
holds, can ship code to production. This category catalogs how to **control access to the
pipeline**, **deliver secrets and cloud credentials safely**, **prove what was built**,
and **promote artifacts through environments** with gates.

A useful way to frame the security model is by trust boundary:

- **Who can change the pipeline?** Editing `.github/workflows`, `.gitlab-ci.yml`, or a
  Jenkinsfile is code execution with the pipeline's privileges. Branch protection, code
  review, and CI RBAC guard this boundary.
- **What identity does the pipeline run as?** The default job token and any cloud
  credentials define the blast radius of a compromised job. Least-privilege tokens,
  environment-scoped secrets, and OIDC federation (no stored long-lived keys) shrink it.
- **What runs the pipeline?** Runners execute untrusted code (including fork PRs).
  Ephemeral, single-use, network-isolated runners contain a compromised job.
- **What gets deployed, and how do we know it is what we built?** Build-once/promote,
  artifact signing, provenance, and verify-on-deploy make the artifact tamper-evident and
  its journey auditable.
- **How does change reach production?** Branch- and environment-based promotion,
  approval gates, and GitOps pull-based reconciliation govern the path to prod.

The diagrams are vendor-aware (GitHub Actions, GitLab CI, Jenkins, Argo CD / Flux, and
generic patterns) because the controls differ in name but rhyme in shape across platforms.

## Diagrams

| Diagram | Status | Description |
|---|---|---|
| [pipeline-access-control](pipeline-access-control/README.md) | ✅ Current | Who can view, run, approve, and modify pipelines: CI/CD RBAC, protected branches vs protected pipelines, least-privilege pipeline identities. |
| [oidc-to-cloud-federation](oidc-to-cloud-federation/README.md) | 🔵 Emerging | Keyless deployment: CI issues an OIDC token, the cloud federates it to short-lived credentials (contrasts long-lived stored cloud keys, ⛔ Deprecated). |
| [secrets-management-in-pipelines](secrets-management-in-pipelines/README.md) | ✅ Current | Injecting secrets safely: native stores, Vault, OIDC-brokered secrets, masking, environment scoping, and avoiding exfiltration. |
| [artifact-signing-provenance](artifact-signing-provenance/README.md) | 🔵 Emerging | Signing artifacts and generating provenance (Sigstore/cosign, in-toto, SLSA), then verify-on-deploy. |
| [environment-protection-approvals](environment-protection-approvals/README.md) | ✅ Current | Deployment environments with required reviewers, wait timers, and manual approval gates. |
| [code-promotion-branch-based](code-promotion-branch-based/README.md) | ✅ Current | Promoting code through branches, merges, and tags: GitFlow (🟡 Legacy for many teams) vs trunk-based development (✅). |
| [code-promotion-environment-based](code-promotion-environment-based/README.md) | ✅ Current | Build-once, promote-the-same-artifact across dev → staging → prod with gates. |
| [gitops-pull-based-deploy](gitops-pull-based-deploy/README.md) | 🔵 Emerging | GitOps: desired state in Git, an in-cluster reconciler (Argo CD / Flux) pulls and applies, with drift detection. |
| [branch-protection-code-review](branch-protection-code-review/README.md) | ✅ Current | Required reviews, status checks, signed commits, CODEOWNERS, and merge queues. |
| [ephemeral-runner-isolation](ephemeral-runner-isolation/README.md) | ✅ Current | Self-hosted vs ephemeral runners, isolation, and the risk of persistent runners running untrusted PR workloads. |

## Related categories

- [Cloud IAM](../cloud-iam/README.md) — the cloud side of OIDC federation:
  [AWS AssumeRoleWithWebIdentity](../cloud-iam/aws/assumerole-web-identity-oidc/README.md),
  [GCP Workload Identity Federation](../cloud-iam/gcp/workload-identity-federation/README.md),
  [Entra workload identity federation](../cloud-iam/entra/workload-identity-federation/README.md).
- [Authorization models](../authorization/README.md) — [RBAC](../authorization/rbac/README.md)
  underlies who can view, run, and approve pipelines.
- [OIDC flows](../oidc/README.md) — the token format and validation reused by CI-to-cloud
  federation and keyless signing.
