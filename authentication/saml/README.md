---
title: "SAML 2.0 Diagrams"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SAML 2.0 Diagrams

Reference diagrams for the SAML 2.0 Web Browser SSO profile, Single Logout profile,
HTTP-Artifact binding, and the Enhanced Client or Proxy (ECP) profile. Each folder
contains a sequence diagram, a swimlane diagram, and a decision-focused flowchart.

| Diagram | Description |
|---|---|
| [sp-initiated-sso](./sp-initiated-sso/README.md) | SP-initiated Web Browser SSO: AuthnRequest via HTTP-Redirect, Response via HTTP-POST, RelayState, full assertion validation. |
| [idp-initiated-sso](./idp-initiated-sso/README.md) | IdP-initiated SSO: unsolicited SAML Response with no InResponseTo, RelayState as deep-link target, and why SP-initiated is preferred. |
| [slo-sp-initiated](./slo-sp-initiated/README.md) | Single Logout started at an SP: LogoutRequest to the IdP, propagation to other session participants, partial-logout status. |
| [slo-idp-initiated](./slo-idp-initiated/README.md) | Single Logout started at the IdP portal: front-channel vs back-channel propagation to all SPs, partial logout handling. |
| [artifact-binding](./artifact-binding/README.md) | HTTP-Artifact binding: small artifact via redirect, back-channel SOAP ArtifactResolve/ArtifactResponse at the Artifact Resolution Service. |
| [ecp](./ecp/README.md) | Enhanced Client or Proxy profile: non-browser client using SOAP/PAOS reverse-SOAP flow between client, SP, and IdP. |

## Related categories

- [OIDC flows](../oidc/authorization-code/README.md) — the OAuth2/OIDC equivalents of these federation patterns.
- [Tokenless authentication](../tokenless/session-cookie/README.md) — what the SP session usually looks like after SAML SSO completes.
- [Federation topology](../../infrastructure/architecture/federation-topology/README.md) — how SPs and IdPs are arranged at the architecture level.
