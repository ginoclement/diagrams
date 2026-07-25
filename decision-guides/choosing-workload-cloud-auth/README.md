# Choosing Workload Cloud Authentication

**Status:** ✅ Current

How should a workload (app, container, CI job, function) authenticate to a cloud provider
or its APIs? This guide chooses between **long-lived static keys** (deprecated),
**managed / instance identity** (platform-issued credentials for compute running *inside*
the cloud), and **workload identity federation** (keyless — exchange an external OIDC/SAML
token for short-lived cloud credentials). The recommendation: **eliminate static keys**;
use managed identity when running on the provider; use federation when running elsewhere.

## How to use this guide

1. Walk [flowchart.md](flowchart.md): the first split is whether the workload runs on the
   target cloud's compute, then whether it has a trustworthy external identity.
2. Follow the leaf's **Leaf link** to the concrete flow.
3. Confirm tradeoffs in [comparison-table.md](comparison-table.md).

## Options at a glance

- 🔵 **Workload identity federation (keyless)** — external OIDC/SAML identity (GitHub
  Actions, another cloud, a K8s SA) exchanged for short-lived cloud credentials. No stored
  secret. Preferred for cross-cloud and CI.
- ✅ **Managed / instance identity** — credentials the platform injects into compute it
  hosts (Entra managed identity via IMDS, GCP ADC/metadata, AWS instance roles). No secret
  to store. Preferred when running *on* the provider.
- ✅ **Service account impersonation** — a permitted principal mints short-lived tokens for
  a target service account, for controlled privilege boundaries.
- ⛔ **Long-lived static keys** — downloaded access-key/secret or service-account JSON key
  files. **Use instead:** managed identity or federation.

## Related diagrams

- [AWS AssumeRole with Web Identity (OIDC federation)](../../cloud-iam/aws/assumerole-web-identity-oidc/README.md)
- Entra Managed Identity (IMDS) *(planned)*
- [GCP Service Account Impersonation](../../cloud-iam/gcp/service-account-impersonation/README.md)
- [GCP Workload Identity Federation](../../cloud-iam/gcp/workload-identity-federation/README.md)
- [Workload identity (category)](../../workload-identity/README.md)
- [CI/CD](../../cicd/README.md) — a common federation consumer.

## Files

- [flowchart.md](flowchart.md) — the decision tree.
- [comparison-table.md](comparison-table.md) — option-by-option tradeoffs and status.
