---
title: "Workload Cloud Authentication — Comparison"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Cloud Authentication — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **Workload identity federation (keyless)** | 🔵 Emerging | CI runners, other clouds, K8s, on-prem with an OIDC/SAML identity | Workload already runs on the target cloud (use managed identity) | No stored secret; needs a trust/pool config and issuer mapping | Constrain trust by `sub`/`aud`/repo/branch; short-lived exchanged tokens |
| **Managed / instance identity** | ✅ Current | Compute hosted by the target cloud (VM, container, function) | Anything running outside that provider | Zero secrets; scoped to the instance; provider-specific | Reachable via metadata endpoint — block SSRF to IMDS; use IMDSv2-style hardening |
| **Service account impersonation** | ✅ Current | Controlled privilege boundaries; short-lived elevation to a target SA | When federation or managed identity already fits | Fine-grained, auditable; extra IAM wiring | Grant `tokenCreator` narrowly; short token TTLs; log impersonation |
| **Long-lived static keys** | ⛔ Deprecated | — | Any new design | Downloaded access keys / SA JSON files | **Why:** they leak, rarely rotate, and are the top cause of cloud breaches. **Use instead:** federation or managed identity. If unavoidable, rotate + scope tightly |

Notes

- Order of preference: managed identity (on-cloud) → federation (off-cloud) →
  impersonation → static keys as an absolute last resort.
- Federation is how CI/CD should reach the cloud — see
  [CI/CD OIDC-to-cloud federation](../../../infrastructure/cicd/oidc-to-cloud-federation/README.md).
- Broader patterns live in [Workload identity](../../../workload-identity/README.md).
