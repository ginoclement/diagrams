---
title: "Cloud IAM"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cloud IAM

Provider-specific identity and access flows for the major clouds. Azure AD is the former
name of **Microsoft Entra ID** — same product, under `entra/`. These reference the generic
[OIDC](../../authentication/oidc/README.md) and [SAML](../../authentication/saml/README.md) flows rather than redrawing them.

## Amazon Web Services

- [AssumeRoleWithSAML (Enterprise SAML to AWS)](./aws/assumerole-saml/README.md)
- [AssumeRoleWithWebIdentity (OIDC Federation)](./aws/assumerole-web-identity-oidc/README.md)
- [Amazon Cognito Identity Pool (AWS Credentials Exchange)](./aws/cognito-identity-pool/README.md)
- [Amazon Cognito User Pool Sign-In](./aws/cognito-user-pool/README.md)
- [AWS Cross-Account Role Assumption](./aws/cross-account-role-assumption/README.md)
- [AWS IAM Identity Center SSO (formerly AWS SSO)](./aws/iam-identity-center-sso/README.md)
- [EC2 Instance Credentials via IMDSv2](./aws/imdsv2-instance-credentials/README.md)
- [IRSA — IAM Roles for Service Accounts (EKS)](./aws/irsa-eks/README.md)
- [AWS Signature Version 4 (SigV4) Request Signing](./aws/sigv4-request-signing/README.md)
- [AWS STS AssumeRole](./aws/sts-assumerole/README.md)

## Microsoft Entra ID (Azure AD)

- [B2B Guest Invitation and Redemption (Entra External ID)](./entra/b2b-external-id-invitation/README.md)
- [Conditional Access Policy Evaluation](./entra/conditional-access-evaluation/README.md)
- [Continuous Access Evaluation (CAE)](./entra/continuous-access-evaluation/README.md)
- [Device Join and Registration (Entra Join / Hybrid Join / Registered)](./entra/device-join-registration/README.md)
- [Entra Hybrid Identity Sync (PHS vs PTA vs Federation)](./entra/hybrid-identity-sync/README.md)
- [Azure Managed Identity via IMDS](./entra/managed-identity-imds/README.md)
- [PIM Just-in-Time Role Elevation](./entra/pim-jit-elevation/README.md)
- [Primary Refresh Token (PRT)](./entra/primary-refresh-token/README.md)
- [Windows Hello for Business (WHfB)](./entra/windows-hello-for-business/README.md)
- [Entra Workload Identity Federation](./entra/workload-identity-federation/README.md)

## Google Cloud

- [Application Default Credentials (ADC)](./gcp/application-default-credentials/README.md)
- [GKE Workload Identity](./gcp/gke-workload-identity/README.md)
- [GCP IAM Allow-Policy Evaluation](./gcp/iam-policy-evaluation/README.md)
- [Identity-Aware Proxy (IAP)](./gcp/identity-aware-proxy/README.md)
- [3-Legged OAuth to Google APIs](./gcp/oauth-google-apis/README.md)
- [Service Account Impersonation](./gcp/service-account-impersonation/README.md)
- [Workload Identity Federation](./gcp/workload-identity-federation/README.md)

