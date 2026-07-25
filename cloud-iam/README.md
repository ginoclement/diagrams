# Cloud IAM

Provider-specific identity and access flows for the major clouds. Azure AD is the former
name of **Microsoft Entra ID** — same product, under `entra/`. These reference the generic
[OIDC](../oidc/README.md) and [SAML](../saml/README.md) flows rather than redrawing them.

## Amazon Web Services

- [AssumeRoleWithSAML (Enterprise SAML to AWS)](./aws/assumerole-saml/README.md)
- [AssumeRoleWithWebIdentity (OIDC Federation)](./aws/assumerole-web-identity-oidc/README.md)
- [Amazon Cognito Identity Pool (AWS Credentials Exchange)](./aws/cognito-identity-pool/README.md)
- [Amazon Cognito User Pool Sign-In](./aws/cognito-user-pool/README.md)
- [AWS IAM Identity Center SSO (formerly AWS SSO)](./aws/iam-identity-center-sso/README.md)
- [AWS STS AssumeRole](./aws/sts-assumerole/README.md)

## Microsoft Entra ID (Azure AD)

- [B2B Guest Invitation and Redemption (Entra External ID)](./entra/b2b-external-id-invitation/README.md)
- [Conditional Access Policy Evaluation](./entra/conditional-access-evaluation/README.md)
- [Continuous Access Evaluation (CAE)](./entra/continuous-access-evaluation/README.md)
- [Device Join and Registration (Entra Join / Hybrid Join / Registered)](./entra/device-join-registration/README.md)
- [PIM Just-in-Time Role Elevation](./entra/pim-jit-elevation/README.md)
- [Primary Refresh Token (PRT)](./entra/primary-refresh-token/README.md)
- [Windows Hello for Business (WHfB)](./entra/windows-hello-for-business/README.md)

## Google Cloud

- [Application Default Credentials (ADC)](./gcp/application-default-credentials/README.md)
- [GKE Workload Identity](./gcp/gke-workload-identity/README.md)
- [GCP IAM Allow-Policy Evaluation](./gcp/iam-policy-evaluation/README.md)
- [Identity-Aware Proxy (IAP)](./gcp/identity-aware-proxy/README.md)
- [Service Account Impersonation](./gcp/service-account-impersonation/README.md)
- [Workload Identity Federation](./gcp/workload-identity-federation/README.md)

