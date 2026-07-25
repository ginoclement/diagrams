# Security & Identity Diagram Repository

A holistic, cross-referenced library of security and identity flows drawn in
[Mermaid](https://mermaid.js.org/) so they render inline on GitHub. It aims to be a catalog
of **every option** for authentication, authorization, identity lifecycle, and the
surrounding infrastructure — including deprecated mechanisms, which are kept and clearly
marked so you can see what to use instead.

Most flows are captured three ways — a **sequence** diagram (message-level exchange), a
**swimlane** (responsibilities per actor), and a **flowchart** (decision and error logic).
Decision guides instead pair a **decision-tree flowchart** with a **comparison table**.

- [`CONVENTIONS.md`](CONVENTIONS.md) — folder layout, diagram rules, Status/deprecation standard, mermaid safety
- [`DEPRECATED.md`](DEPRECATED.md) — deprecated & legacy mechanisms, with "use instead" pointers
- [`BACKLOG.md`](BACKLOG.md) — build log (currently: complete)

Each diagram README carries a **Status**: ✅ Current · 🟡 Legacy · ⛔ Deprecated · 🔵 Emerging.

## Categories

| Category | Focus | Diagrams |
|---|---|---|
| [saml](./saml/README.md) | SAML 2.0 web SSO, logout, profiles | 6 |
| [oidc](./oidc/README.md) | OAuth 2.0 / OpenID Connect grants, logout, protocol extensions | 22 |
| [tokenless](./tokenless/README.md) | Auth patterns without bearer tokens | 7 |
| [kerberos](./kerberos/README.md) | Kerberos exchanges and delegation | 9 |
| [authorization](./authorization/README.md) | Authorization models (RBAC/ABAC/ReBAC/PBAC/XACML) | 8 |
| [adaptive-access](./adaptive-access/README.md) | Risk-based, step-up, continuous access | 6 |
| [user-lifecycle](./user-lifecycle/README.md) | Joiner/mover/leaver and governance | 6 |
| [enrollment-and-update](./enrollment-and-update/README.md) | Registering authenticators, devices, certs | 6 |
| [password-management](./password-management/README.md) | Reset, change, rotation, breach checks | 6 |
| [privileged-access](./privileged-access/README.md) | PAM/PIM, JIT, break-glass, bastion | 6 |
| [directory-and-sync](./directory-and-sync/README.md) | LDAP/AD auth and directory synchronization | 7 |
| [cloud-iam](./cloud-iam/README.md) | Entra ID, AWS, and GCP identity flows | 27 |
| [platform-specific](./platform-specific/README.md) | Vendor-unique flows (Okta/Auth0/ForgeRock/PocketID) | 8 |
| [workload-identity](./workload-identity/README.md) | Non-human / workload identity | 6 |
| [cicd](./cicd/README.md) | CI/CD access control, pipelines, code promotion | 10 |
| [threat-defense](./threat-defense/README.md) | Attack-and-defense pairs | 8 |
| [personas](./personas/README.md) | Persona archetypes and per-persona flow forks | 5 |
| [decision-guides](./decision-guides/README.md) | Which mechanism to choose, and why | 8 |
| [architecture](./architecture/README.md) | System topology and trust boundaries | 6 |
| [network-security](./network-security/README.md) | Transport, segmentation, perimeter | 6 |
| | **Total** | **173** |

## Diagram index

### [saml](./saml/README.md) — SAML 2.0 web SSO, logout, profiles

- [HTTP-Artifact Binding](./saml/artifact-binding/README.md)
- [Enhanced Client or Proxy (ECP) Profile](./saml/ecp/README.md)
- [IdP-Initiated Web Browser SSO](./saml/idp-initiated-sso/README.md)
- [Single Logout — IdP-Initiated](./saml/slo-idp-initiated/README.md)
- [Single Logout — SP-Initiated](./saml/slo-sp-initiated/README.md)
- [SP-Initiated Web Browser SSO](./saml/sp-initiated-sso/README.md)

### [oidc](./oidc/README.md) — OAuth 2.0 / OpenID Connect grants, logout, protocol extensions

- [OIDC Authorization Code Flow (Confidential Client)](./oidc/authorization-code/README.md)
- [OIDC Authorization Code Flow with PKCE (Public Client)](./oidc/authorization-code-pkce/README.md)
- [Back-Channel Logout](./oidc/back-channel-logout/README.md)
- [CIBA — Client-Initiated Backchannel Authentication](./oidc/ciba/README.md)
- [OAuth 2.0 Client Credentials Grant (Machine-to-Machine)](./oidc/client-credentials/README.md)
- [Device Authorization Grant (RFC 8628)](./oidc/device-authorization/README.md)
- [DPoP — Demonstrating Proof of Possession (RFC 9449)](./oidc/dpop/README.md)
- [OAuth 2.0 Dynamic Client Registration (RFC 7591 / RFC 7592)](./oidc/dynamic-client-registration/README.md)
- [Front-Channel Logout](./oidc/front-channel-logout/README.md)
- [OIDC Hybrid Flow (response_type=code id_token)](./oidc/hybrid/README.md)
- [OIDC Implicit Flow (Legacy — Deprecated)](./oidc/implicit/README.md)
- [JWT-Secured Authorization Request (JAR, RFC 9101) and Response Mode (JARM)](./oidc/jar-jarm/README.md)
- [OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens (RFC 8705)](./oidc/mtls-bound-tokens/README.md)
- [Pushed Authorization Requests (PAR, RFC 9126)](./oidc/pushed-authorization-requests/README.md)
- [OAuth 2.0 / OIDC Refresh Token Grant](./oidc/refresh-token/README.md)
- [Resource Owner Password Credentials (ROPC) Grant](./oidc/resource-owner-password-credentials/README.md)
- [Rich Authorization Requests (RAR, RFC 9396)](./oidc/rich-authorization-requests/README.md)
- [RP-Initiated Logout](./oidc/rp-initiated-logout/README.md)
- [OpenID Connect Session Management 1.0](./oidc/session-management/README.md)
- [OAuth 2.0 Token Exchange (RFC 8693)](./oidc/token-exchange/README.md)
- [OAuth 2.0 Token Introspection (RFC 7662)](./oidc/token-introspection/README.md)
- [OAuth 2.0 Token Revocation (RFC 7009)](./oidc/token-revocation/README.md)

### [tokenless](./tokenless/README.md) — Auth patterns without bearer tokens

- [Header-Based SSO (Proxy-Injected Identity Headers)](./tokenless/header-based-sso/README.md)
- [HTTP Basic Authentication](./tokenless/http-basic-auth/README.md)
- [IP Allowlist / Network-Location Authentication](./tokenless/ip-allowlist-network-auth/README.md)
- [Magic Link (Passwordless Email Login)](./tokenless/magic-link/README.md)
- [Mutual TLS (mTLS) Client-Certificate Authentication](./tokenless/mutual-tls/README.md)
- [Session Cookie Authentication](./tokenless/session-cookie/README.md)
- [WebAuthn / Passkey Authentication Ceremony](./tokenless/webauthn-passkey-authentication/README.md)

### [kerberos](./kerberos/README.md) — Kerberos exchanges and delegation

- [Kerberos AP Exchange (AP-REQ / AP-REP)](./kerberos/ap-exchange/README.md)
- [Kerberos AS Exchange (AS-REQ / AS-REP)](./kerberos/as-exchange/README.md)
- [Kerberos Constrained Delegation — S4U2Self and S4U2Proxy](./kerberos/constrained-delegation/README.md)
- [Kerberos Cross-Realm Authentication](./kerberos/cross-realm/README.md)
- [PKINIT (Certificate / Smart-Card Initial Authentication)](./kerberos/pkinit/README.md)
- [Resource-Based Constrained Delegation (RBCD)](./kerberos/resource-based-constrained-delegation/README.md)
- [SPNEGO over HTTP (HTTP Negotiate)](./kerberos/spnego-http/README.md)
- [Kerberos TGS Exchange (TGS-REQ / TGS-REP)](./kerberos/tgs-exchange/README.md)
- [Kerberos Unconstrained Delegation](./kerberos/unconstrained-delegation/README.md)

### [authorization](./authorization/README.md) — Authorization models (RBAC/ABAC/ReBAC/PBAC/XACML)

- [Attribute-Based Access Control (ABAC)](./authorization/abac/README.md)
- [OAuth Consent as an Authorization Mechanism](./authorization/oauth-consent-authorization/README.md)
- [Policy-Based Access Control with an External Policy Engine (OPA / Cedar)](./authorization/pbac-policy-engine/README.md)
- [Policy Decision and Enforcement (PEP / PDP / PIP / PAP)](./authorization/policy-decision-enforcement/README.md)
- [Role-Based Access Control (RBAC)](./authorization/rbac/README.md)
- [Relationship-Based Access Control (ReBAC) — Google Zanzibar Model](./authorization/rebac-zanzibar/README.md)
- [Scopes, Claims, and Entitlements](./authorization/scopes-claims-entitlements/README.md)
- [XACML — PDP / PEP Reference Architecture](./authorization/xacml-pdp-pep/README.md)

### [adaptive-access](./adaptive-access/README.md) — Risk-based, step-up, continuous access

- [Continuous Access Evaluation (CAE)](./adaptive-access/continuous-access-evaluation/README.md)
- [Device Posture Conditional Access](./adaptive-access/device-posture-conditional-access/README.md)
- [Impossible Travel / Anomalous Session Detection](./adaptive-access/impossible-travel-anomaly/README.md)
- [MFA Fatigue (Push Bombing) and Number Matching](./adaptive-access/mfa-fatigue-number-matching/README.md)
- [Risk-Based Adaptive Authentication](./adaptive-access/risk-based-adaptive-authentication/README.md)
- [Step-Up Authentication](./adaptive-access/step-up-authentication/README.md)

### [user-lifecycle](./user-lifecycle/README.md) — Joiner/mover/leaver and governance

- [Access Review & Certification](./user-lifecycle/access-review-certification/README.md)
- [JML Orchestration — Lifecycle Overview](./user-lifecycle/jml-orchestration/README.md)
- [Joiner — Onboarding & Birthright Provisioning](./user-lifecycle/joiner-onboarding/README.md)
- [Leaver — Offboarding & Deprovisioning](./user-lifecycle/leaver-offboarding/README.md)
- [Mover — Role Change & Access Re-evaluation](./user-lifecycle/mover-role-change/README.md)
- [SCIM 2.0 Provisioning](./user-lifecycle/scim-provisioning/README.md)

### [enrollment-and-update](./enrollment-and-update/README.md) — Registering authenticators, devices, certs

- [Certificate Enrollment (SCEP and EST)](./enrollment-and-update/certificate-enrollment-scep-est/README.md)
- [Device Enrollment (MDM / UEM)](./enrollment-and-update/device-enrollment-mdm/README.md)
- [Email / Phone Verification (Contact-Channel Verification)](./enrollment-and-update/email-phone-verification/README.md)
- [FIDO2 / Passkey Registration Ceremony](./enrollment-and-update/fido2-passkey-registration/README.md)
- [MFA Enrollment (Registering a New Authentication Factor)](./enrollment-and-update/mfa-enrollment/README.md)
- [Profile Attribute Update (Self-Service)](./enrollment-and-update/profile-attribute-update/README.md)

### [password-management](./password-management/README.md) — Reset, change, rotation, breach checks

- [Account Unlock](./password-management/account-unlock/README.md)
- [Admin-Initiated Password Reset](./password-management/admin-initiated-reset/README.md)
- [Breached Password Detection](./password-management/breached-password-detection/README.md)
- [Authenticated Password Change](./password-management/password-change-authenticated/README.md)
- [Password Expiry and Rotation](./password-management/password-expiry-rotation/README.md)
- [Self-Service Password Reset (SSPR)](./password-management/self-service-reset/README.md)

### [privileged-access](./privileged-access/README.md) — PAM/PIM, JIT, break-glass, bastion

- [Break-Glass Emergency Access](./privileged-access/break-glass-emergency-access/README.md)
- [Credential Vault Check-Out / Check-In](./privileged-access/credential-vault-checkout/README.md)
- [Just-In-Time Privilege Elevation](./privileged-access/jit-privilege-elevation/README.md)
- [Secrets Broker with Dynamic Credentials](./privileged-access/secrets-broker-dynamic-credentials/README.md)
- [Privileged Session Recording and Monitoring](./privileged-access/session-recording-monitoring/README.md)
- [SSH Bastion / Jump Host with Short-Lived Certificates](./privileged-access/ssh-bastion-jump-host/README.md)

### [directory-and-sync](./directory-and-sync/README.md) — LDAP/AD auth and directory synchronization

- [Active Directory Interactive Logon](./directory-and-sync/active-directory-logon/README.md)
- [Federated vs Managed Authentication](./directory-and-sync/federated-vs-managed-auth/README.md)
- [Group Membership Sync](./directory-and-sync/group-membership-sync/README.md)
- [HR-Driven Inbound Provisioning](./directory-and-sync/hr-driven-inbound-provisioning/README.md)
- [LDAP Bind Authentication](./directory-and-sync/ldap-bind-authentication/README.md)
- [Pass-Through Authentication (PTA)](./directory-and-sync/pass-through-authentication/README.md)
- [Password Hash Synchronization (PHS)](./directory-and-sync/password-hash-sync/README.md)

### [cloud-iam](./cloud-iam/README.md) — Entra ID, AWS, and GCP identity flows

- [AssumeRoleWithSAML (Enterprise SAML to AWS)](./cloud-iam/aws/assumerole-saml/README.md)
- [AssumeRoleWithWebIdentity (OIDC Federation)](./cloud-iam/aws/assumerole-web-identity-oidc/README.md)
- [Amazon Cognito Identity Pool (AWS Credentials Exchange)](./cloud-iam/aws/cognito-identity-pool/README.md)
- [Amazon Cognito User Pool Sign-In](./cloud-iam/aws/cognito-user-pool/README.md)
- [AWS Cross-Account Role Assumption](./cloud-iam/aws/cross-account-role-assumption/README.md)
- [AWS IAM Identity Center SSO (formerly AWS SSO)](./cloud-iam/aws/iam-identity-center-sso/README.md)
- [EC2 Instance Credentials via IMDSv2](./cloud-iam/aws/imdsv2-instance-credentials/README.md)
- [IRSA — IAM Roles for Service Accounts (EKS)](./cloud-iam/aws/irsa-eks/README.md)
- [AWS Signature Version 4 (SigV4) Request Signing](./cloud-iam/aws/sigv4-request-signing/README.md)
- [AWS STS AssumeRole](./cloud-iam/aws/sts-assumerole/README.md)
- [B2B Guest Invitation and Redemption (Entra External ID)](./cloud-iam/entra/b2b-external-id-invitation/README.md)
- [Conditional Access Policy Evaluation](./cloud-iam/entra/conditional-access-evaluation/README.md)
- [Continuous Access Evaluation (CAE)](./cloud-iam/entra/continuous-access-evaluation/README.md)
- [Device Join and Registration (Entra Join / Hybrid Join / Registered)](./cloud-iam/entra/device-join-registration/README.md)
- [Entra Hybrid Identity Sync (PHS vs PTA vs Federation)](./cloud-iam/entra/hybrid-identity-sync/README.md)
- [Azure Managed Identity via IMDS](./cloud-iam/entra/managed-identity-imds/README.md)
- [PIM Just-in-Time Role Elevation](./cloud-iam/entra/pim-jit-elevation/README.md)
- [Primary Refresh Token (PRT)](./cloud-iam/entra/primary-refresh-token/README.md)
- [Windows Hello for Business (WHfB)](./cloud-iam/entra/windows-hello-for-business/README.md)
- [Entra Workload Identity Federation](./cloud-iam/entra/workload-identity-federation/README.md)
- [Application Default Credentials (ADC)](./cloud-iam/gcp/application-default-credentials/README.md)
- [GKE Workload Identity](./cloud-iam/gcp/gke-workload-identity/README.md)
- [GCP IAM Allow-Policy Evaluation](./cloud-iam/gcp/iam-policy-evaluation/README.md)
- [Identity-Aware Proxy (IAP)](./cloud-iam/gcp/identity-aware-proxy/README.md)
- [3-Legged OAuth to Google APIs](./cloud-iam/gcp/oauth-google-apis/README.md)
- [Service Account Impersonation](./cloud-iam/gcp/service-account-impersonation/README.md)
- [Workload Identity Federation](./cloud-iam/gcp/workload-identity-federation/README.md)

### [platform-specific](./platform-specific/README.md) — Vendor-unique flows (Okta/Auth0/ForgeRock/PocketID)

- [Auth0 Organizations — B2B Invitation & Org-Context Login](./platform-specific/auth0-organizations-invitation/README.md)
- [Auth0 Universal Login + Actions (Post-Login Pipeline)](./platform-specific/auth0-universal-login-actions/README.md)
- [ForgeRock / PingAM Authentication Journeys (Trees)](./platform-specific/forgerock-authentication-journey/README.md)
- [ForgeRock IDM — Sync & Reconciliation](./platform-specific/forgerock-idm-sync-reconciliation/README.md)
- [Okta FastPass — Device-Bound Passwordless Authentication](./platform-specific/okta-fastpass-passwordless/README.md)
- [Okta Identity Engine (OIE) Policy-Driven Sign-In](./platform-specific/okta-identity-engine-signin/README.md)
- [Okta Inline Hooks — Synchronous External Callouts](./platform-specific/okta-inline-hooks/README.md)
- [PocketID — Passkey-Only OIDC Provider](./platform-specific/pocketid-passkey-oidc/README.md)

### [workload-identity](./workload-identity/README.md) — Non-human / workload identity

- [Kubernetes Projected ServiceAccount Token](./workload-identity/kubernetes-serviceaccount-token/README.md)
- [Mutual TLS Identity Bootstrap](./workload-identity/mutual-tls-bootstrap/README.md)
- [Secretless Instance Identity (IMDS / Metadata Server)](./workload-identity/secretless-instance-identity/README.md)
- [Service-Account Key Lifecycle](./workload-identity/service-account-key-lifecycle/README.md)
- [SPIFFE Identity Issuance with SPIRE](./workload-identity/spiffe-spire-issuance/README.md)
- [Workload Identity Federation (Generic Pattern)](./workload-identity/workload-identity-federation-generic/README.md)

### [cicd](./cicd/README.md) — CI/CD access control, pipelines, code promotion

- [Artifact Signing and Provenance (Verify on Deploy)](./cicd/artifact-signing-provenance/README.md)
- [Branch Protection and Code Review](./cicd/branch-protection-code-review/README.md)
- [Branch-Based Code Promotion (GitFlow vs Trunk-Based)](./cicd/code-promotion-branch-based/README.md)
- [Environment-Based Code Promotion (Build Once, Promote the Same Artifact)](./cicd/code-promotion-environment-based/README.md)
- [Deployment Environment Protection and Approvals](./cicd/environment-protection-approvals/README.md)
- [Ephemeral Runner Isolation](./cicd/ephemeral-runner-isolation/README.md)
- [GitOps Pull-Based Deployment (In-Cluster Reconciler)](./cicd/gitops-pull-based-deploy/README.md)
- [OIDC Federation from CI to Cloud (Keyless Deploy)](./cicd/oidc-to-cloud-federation/README.md)
- [Pipeline Access Control (CI/CD RBAC)](./cicd/pipeline-access-control/README.md)
- [Secrets Management in Pipelines](./cicd/secrets-management-in-pipelines/README.md)

### [threat-defense](./threat-defense/README.md) — Attack-and-defense pairs

- [Adversary-in-the-Middle (AiTM) MFA Phishing](./threat-defense/aitm-mfa-phishing/README.md)
- [Device Code Phishing](./threat-defense/device-code-phishing/README.md)
- [Golden SAML](./threat-defense/golden-saml/README.md)
- [Golden & Silver Ticket](./threat-defense/golden-silver-ticket/README.md)
- [Kerberoasting](./threat-defense/kerberoasting/README.md)
- [OAuth Consent Phishing (Illicit Consent Grant)](./threat-defense/oauth-consent-phishing/README.md)
- [Pass-the-Hash / Pass-the-Ticket](./threat-defense/pass-the-hash-ticket/README.md)
- [Token Theft & Replay](./threat-defense/token-theft-replay/README.md)

### [personas](./personas/README.md) — Persona archetypes and per-persona flow forks

- [Access Review by Persona](./personas/access-review-by-persona/README.md)
- [Authentication by Persona](./personas/authentication-by-persona/README.md)
- [Credential Recovery by Persona](./personas/credential-recovery-by-persona/README.md)
- [Enrollment by Persona](./personas/enrollment-by-persona/README.md)
- [JML Lifecycle by Persona](./personas/jml-lifecycle-by-persona/README.md)

### [decision-guides](./decision-guides/README.md) — Which mechanism to choose, and why

- [Choosing a Kerberos Delegation Model](./decision-guides/choosing-a-kerberos-delegation-model/README.md)
- [Choosing an Authentication Protocol](./decision-guides/choosing-an-authentication-protocol/README.md)
- [Choosing an Authorization Model](./decision-guides/choosing-an-authorization-model/README.md)
- [Choosing an MFA Factor](./decision-guides/choosing-an-mfa-factor/README.md)
- [Choosing an OAuth 2.0 Grant](./decision-guides/choosing-an-oauth-grant/README.md)
- [Choosing Session vs Token](./decision-guides/choosing-session-vs-token/README.md)
- [Choosing Workload Cloud Authentication](./decision-guides/choosing-workload-cloud-auth/README.md)
- [SAML-to-OIDC Migration](./decision-guides/saml-to-oidc-migration/README.md)

### [architecture](./architecture/README.md) — System topology and trust boundaries

- [API Gateway Authentication & Authorization (BFF Pattern)](./architecture/api-gateway-authn-authz/README.md)
- [Federation Topology (Identity Broker / Hub-and-Spoke)](./architecture/federation-topology/README.md)
- [Identity Provider (IdP) Reference Architecture](./architecture/identity-provider-reference-architecture/README.md)
- [PKI Trust Hierarchy](./architecture/pki-hierarchy/README.md)
- [Secrets Management Platform (Vault-style)](./architecture/secrets-management/README.md)
- [Zero Trust Architecture (NIST SP 800-207)](./architecture/zero-trust-architecture/README.md)

### [network-security](./network-security/README.md) — Transport, segmentation, perimeter

- [Defense in Depth — Layered Firewall, IDS/IPS, and Host Defenses](./network-security/defense-in-depth-firewall/README.md)
- [mTLS in a Service Mesh](./network-security/mtls-service-mesh/README.md)
- [Network Segmentation and the DMZ](./network-security/network-segmentation-dmz/README.md)
- [Reverse Proxy and Web Application Firewall](./network-security/reverse-proxy-waf/README.md)
- [TLS 1.3 Handshake](./network-security/tls-handshake/README.md)
- [Remote Access VPN](./network-security/vpn-remote-access/README.md)

