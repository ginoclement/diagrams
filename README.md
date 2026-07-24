# Security & Identity Diagram Repository

A holistic, reference library of security and identity flows, drawn in
[Mermaid](https://mermaid.js.org/) so they render inline on GitHub. Every flow is
captured three ways — a **sequence** diagram (message-level exchange), a **swimlane**
diagram (responsibilities per actor), and a **flowchart** (decision and error logic) —
and each lives in its own folder with a README describing actors, when it is used,
alternate scenarios, and links to related diagrams.

See [`CONVENTIONS.md`](CONVENTIONS.md) for the folder layout, diagram rules, and
mermaid syntax-safety guidelines every diagram follows. Every mermaid block in this
repository is validated with the mermaid parser, and every relative cross-link is
checked to resolve.

## How to read a diagram folder

```
<category>/<diagram>/
  README.md      what it is, actors, when used, alternates, related diagrams
  sequence.md    sequenceDiagram — happy path first, alt/opt/par for variants
  swimlane.md    flowchart with one subgraph lane per actor
  flowchart.md   decision logic with explicit validation gates and error terminals
```

## Categories at a glance

| Category | Focus | Diagrams |
|---|---|---|
| [saml](./saml/README.md) | SAML 2.0 web SSO, logout, and profiles | 6 |
| [oidc](./oidc/README.md) | OAuth 2.0 / OpenID Connect grants and logout | 11 |
| [tokenless](./tokenless/README.md) | Auth patterns without bearer tokens | 7 |
| [kerberos](./kerberos/README.md) | Kerberos exchanges and delegation | 9 |
| [user-lifecycle](./user-lifecycle/README.md) | Joiner / mover / leaver and governance | 6 |
| [enrollment-and-update](./enrollment-and-update/README.md) | Registering authenticators, devices, certs | 6 |
| [password-management](./password-management/README.md) | Reset, change, rotation, breach checks | 6 |
| [platform-specific](./platform-specific/README.md) | Vendor-unique flows (Okta/Auth0/ForgeRock/PocketID) | 8 |
| [architecture](./architecture/README.md) | System topology and trust boundaries | 6 |
| [network-security](./network-security/README.md) | Transport, segmentation, perimeter | 6 |

## Categories

### [saml](./saml/README.md) — SAML 2.0 Diagrams

- [HTTP-Artifact Binding](./saml/artifact-binding/README.md)
- [Enhanced Client or Proxy (ECP) Profile](./saml/ecp/README.md)
- [IdP-Initiated Web Browser SSO](./saml/idp-initiated-sso/README.md)
- [Single Logout — IdP-Initiated](./saml/slo-idp-initiated/README.md)
- [Single Logout — SP-Initiated](./saml/slo-sp-initiated/README.md)
- [SP-Initiated Web Browser SSO](./saml/sp-initiated-sso/README.md)

### [oidc](./oidc/README.md) — OIDC Flows

- [OIDC Authorization Code Flow with PKCE (Public Client)](./oidc/authorization-code-pkce/README.md)
- [OIDC Authorization Code Flow (Confidential Client)](./oidc/authorization-code/README.md)
- [Back-Channel Logout](./oidc/back-channel-logout/README.md)
- [CIBA — Client-Initiated Backchannel Authentication](./oidc/ciba/README.md)
- [OAuth 2.0 Client Credentials Grant (Machine-to-Machine)](./oidc/client-credentials/README.md)
- [Device Authorization Grant (RFC 8628)](./oidc/device-authorization/README.md)
- [Front-Channel Logout](./oidc/front-channel-logout/README.md)
- [OIDC Hybrid Flow (response_type=code id_token)](./oidc/hybrid/README.md)
- [OIDC Implicit Flow (Legacy — Deprecated)](./oidc/implicit/README.md)
- [OAuth 2.0 / OIDC Refresh Token Grant](./oidc/refresh-token/README.md)
- [RP-Initiated Logout](./oidc/rp-initiated-logout/README.md)

### [tokenless](./tokenless/README.md) — Tokenless Authentication Patterns

- [Header-Based SSO (Proxy-Injected Identity Headers)](./tokenless/header-based-sso/README.md)
- [HTTP Basic Authentication](./tokenless/http-basic-auth/README.md)
- [IP Allowlist / Network-Location Authentication](./tokenless/ip-allowlist-network-auth/README.md)
- [Magic Link (Passwordless Email Login)](./tokenless/magic-link/README.md)
- [Mutual TLS (mTLS) Client-Certificate Authentication](./tokenless/mutual-tls/README.md)
- [Session Cookie Authentication](./tokenless/session-cookie/README.md)
- [WebAuthn / Passkey Authentication Ceremony](./tokenless/webauthn-passkey-authentication/README.md)

### [kerberos](./kerberos/README.md) — Kerberos

- [Kerberos AP Exchange (AP-REQ / AP-REP)](./kerberos/ap-exchange/README.md)
- [Kerberos AS Exchange (AS-REQ / AS-REP)](./kerberos/as-exchange/README.md)
- [Kerberos Constrained Delegation — S4U2Self and S4U2Proxy](./kerberos/constrained-delegation/README.md)
- [Kerberos Cross-Realm Authentication](./kerberos/cross-realm/README.md)
- [PKINIT (Certificate / Smart-Card Initial Authentication)](./kerberos/pkinit/README.md)
- [Resource-Based Constrained Delegation (RBCD)](./kerberos/resource-based-constrained-delegation/README.md)
- [SPNEGO over HTTP (HTTP Negotiate)](./kerberos/spnego-http/README.md)
- [Kerberos TGS Exchange (TGS-REQ / TGS-REP)](./kerberos/tgs-exchange/README.md)
- [Kerberos Unconstrained Delegation](./kerberos/unconstrained-delegation/README.md)

### [user-lifecycle](./user-lifecycle/README.md) — User Lifecycle & Identity Governance (Joiner-Mover-Leaver)

- [Access Review & Certification](./user-lifecycle/access-review-certification/README.md)
- [JML Orchestration — Lifecycle Overview](./user-lifecycle/jml-orchestration/README.md)
- [Joiner — Onboarding & Birthright Provisioning](./user-lifecycle/joiner-onboarding/README.md)
- [Leaver — Offboarding & Deprovisioning](./user-lifecycle/leaver-offboarding/README.md)
- [Mover — Role Change & Access Re-evaluation](./user-lifecycle/mover-role-change/README.md)
- [SCIM 2.0 Provisioning](./user-lifecycle/scim-provisioning/README.md)

### [enrollment-and-update](./enrollment-and-update/README.md) — Enrollment & Update (Registering and Updating Credentials, Devices, and Profile Data)

- [Certificate Enrollment (SCEP and EST)](./enrollment-and-update/certificate-enrollment-scep-est/README.md)
- [Device Enrollment (MDM / UEM)](./enrollment-and-update/device-enrollment-mdm/README.md)
- [Email / Phone Verification (Contact-Channel Verification)](./enrollment-and-update/email-phone-verification/README.md)
- [FIDO2 / Passkey Registration Ceremony](./enrollment-and-update/fido2-passkey-registration/README.md)
- [MFA Enrollment (Registering a New Authentication Factor)](./enrollment-and-update/mfa-enrollment/README.md)
- [Profile Attribute Update (Self-Service)](./enrollment-and-update/profile-attribute-update/README.md)

### [password-management](./password-management/README.md) — Password Management

- [Account Unlock](./password-management/account-unlock/README.md)
- [Admin-Initiated Password Reset](./password-management/admin-initiated-reset/README.md)
- [Breached Password Detection](./password-management/breached-password-detection/README.md)
- [Authenticated Password Change](./password-management/password-change-authenticated/README.md)
- [Password Expiry and Rotation](./password-management/password-expiry-rotation/README.md)
- [Self-Service Password Reset (SSPR)](./password-management/self-service-reset/README.md)

### [platform-specific](./platform-specific/README.md) — platform-specific — Vendor-Specific Identity Flows

- [Auth0 Organizations — B2B Invitation & Org-Context Login](./platform-specific/auth0-organizations-invitation/README.md)
- [Auth0 Universal Login + Actions (Post-Login Pipeline)](./platform-specific/auth0-universal-login-actions/README.md)
- [ForgeRock / PingAM Authentication Journeys (Trees)](./platform-specific/forgerock-authentication-journey/README.md)
- [ForgeRock IDM — Sync & Reconciliation](./platform-specific/forgerock-idm-sync-reconciliation/README.md)
- [Okta FastPass — Device-Bound Passwordless Authentication](./platform-specific/okta-fastpass-passwordless/README.md)
- [Okta Identity Engine (OIE) Policy-Driven Sign-In](./platform-specific/okta-identity-engine-signin/README.md)
- [Okta Inline Hooks — Synchronous External Callouts](./platform-specific/okta-inline-hooks/README.md)
- [PocketID — Passkey-Only OIDC Provider](./platform-specific/pocketid-passkey-oidc/README.md)

### [architecture](./architecture/README.md) — Architecture Diagrams

- [API Gateway Authentication & Authorization (BFF Pattern)](./architecture/api-gateway-authn-authz/README.md)
- [Federation Topology (Identity Broker / Hub-and-Spoke)](./architecture/federation-topology/README.md)
- [Identity Provider (IdP) Reference Architecture](./architecture/identity-provider-reference-architecture/README.md)
- [PKI Trust Hierarchy](./architecture/pki-hierarchy/README.md)
- [Secrets Management Platform (Vault-style)](./architecture/secrets-management/README.md)
- [Zero Trust Architecture (NIST SP 800-207)](./architecture/zero-trust-architecture/README.md)

### [network-security](./network-security/README.md) — Network Security Diagrams

- [Defense in Depth — Layered Firewall, IDS/IPS, and Host Defenses](./network-security/defense-in-depth-firewall/README.md)
- [mTLS in a Service Mesh](./network-security/mtls-service-mesh/README.md)
- [Network Segmentation and the DMZ](./network-security/network-segmentation-dmz/README.md)
- [Reverse Proxy and Web Application Firewall](./network-security/reverse-proxy-waf/README.md)
- [TLS 1.3 Handshake](./network-security/tls-handshake/README.md)
- [Remote Access VPN](./network-security/vpn-remote-access/README.md)

