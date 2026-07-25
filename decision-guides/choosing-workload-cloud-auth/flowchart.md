# Choosing Workload Cloud Authentication — Decision Tree

Leaves name the recommended mechanism. Long-lived static keys are ⛔ with their replacement.

```mermaid
flowchart TD
    S(["Workload needs to authenticate<br/>to a cloud / its APIs"]) --> Q1{"Does the workload run on the<br/>target cloud's own compute?"}

    Q1 -->|Yes - VM, container, function| MI(["Use Managed / Instance Identity<br/>(secretless, via metadata)"])

    Q1 -->|No - external: CI, other cloud, on-prem| Q2{"Has a trustworthy external<br/>identity (OIDC / SAML / K8s SA)?"}
    Q2 -->|Yes| WIF(["Use Workload Identity Federation<br/>🔵 keyless"])
    Q2 -->|No external identity| Q3{"Can a permitted principal<br/>mint short-lived tokens?"}
    Q3 -->|Yes| IMP(["Use Service Account Impersonation"])
    Q3 -->|No - tempted by a downloaded key| KEY(["⛔ Long-lived static key -<br/>use federation / managed identity"])
```

Leaf links

- **Use Managed / Instance Identity** → [`../../workload-identity/secretless-instance-identity/`](../../workload-identity/secretless-instance-identity/README.md) (e.g. Entra managed identity via IMDS *(planned)*)
- **Use Workload Identity Federation** → [`../../workload-identity/workload-identity-federation-generic/`](../../workload-identity/workload-identity-federation-generic/README.md) (e.g. [AWS AssumeRole with Web Identity](../../cloud-iam/aws/assumerole-web-identity-oidc/README.md), [CI/CD OIDC-to-cloud](../../cicd/oidc-to-cloud-federation/README.md))
- **Use Service Account Impersonation** → [`../../cloud-iam/gcp/service-account-impersonation/`](../../cloud-iam/gcp/service-account-impersonation/README.md)
- **⛔ Long-lived static key** → replacement [`../../workload-identity/workload-identity-federation-generic/`](../../workload-identity/workload-identity-federation-generic/README.md) (reference: [key lifecycle](../../workload-identity/service-account-key-lifecycle/README.md))
