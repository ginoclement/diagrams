# Security & Identity Diagram Repository

A holistic, reference library of security and identity flows, drawn in
[Mermaid](https://mermaid.js.org/) so they render inline on GitHub. Every flow is
captured three ways — a **sequence** diagram (message-level exchange), a **swimlane**
diagram (responsibilities per actor), and a **flowchart** (decision and error logic) —
and each lives in its own folder with a README describing actors, when it is used,
alternate scenarios, and links to related diagrams.

See [`CONVENTIONS.md`](CONVENTIONS.md) for the folder layout, diagram rules, and
mermaid syntax-safety guidelines every diagram follows.

## How to read a diagram folder

```
<category>/<diagram>/
  README.md      what it is, actors, when used, alternates, related diagrams
  sequence.md    sequenceDiagram — happy path first, alt/opt/par for variants
  swimlane.md    flowchart with one subgraph lane per actor
  flowchart.md   decision logic with explicit validation gates and error terminals
```

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

