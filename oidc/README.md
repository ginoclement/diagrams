---
title: "OIDC Flows"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Flows

OpenID Connect (and underlying OAuth 2.0) grant and logout flows. Each folder contains a
sequence diagram, a swimlane diagram, and a decision-focused flowchart plus a README with
actors, alternates, and security notes.

| Diagram | Description |
|---|---|
| [authorization-code](authorization-code/README.md) | The baseline OIDC flow for confidential clients: front-channel code, back-channel redemption with client authentication, ID token validation, UserInfo. |
| [authorization-code-pkce](authorization-code-pkce/README.md) | Authorization code for public clients (SPA/native): S256 code_challenge binds the code to the app instance, no client secret. |
| [implicit](implicit/README.md) | Legacy flow returning tokens directly in the URL fragment; deprecated due to token leakage — kept here as a reference and cautionary tale. |
| [hybrid](hybrid/README.md) | response_type=code id_token: front-channel ID token for an immediate session plus back-channel code redemption, tied together by c_hash. |
| [client-credentials](client-credentials/README.md) | Machine-to-machine grant with no user: the client authenticates as itself and gets an access token for an API. |
| [refresh-token](refresh-token/README.md) | Renewing access tokens without user interaction; rotation with reuse detection and token-family revocation. |
| [device-authorization](device-authorization/README.md) | Input-constrained devices (TVs, CLIs): user_code entered on a second device while the client polls the token endpoint. |
| [ciba](ciba/README.md) | Client-Initiated Backchannel Authentication: a decoupled flow where the user approves on their own device, no browser redirect. |
| [rp-initiated-logout](rp-initiated-logout/README.md) | The RP sends the user to the OP end_session_endpoint to terminate the OP session and redirect back. |
| [front-channel-logout](front-channel-logout/README.md) | OP notifies RPs of logout via hidden browser iframes loading each RP's frontchannel_logout_uri. |
| [back-channel-logout](back-channel-logout/README.md) | OP notifies RPs server-to-server with a signed logout_token JWT — works without a live browser. |

## Related categories

- [SAML flows](../saml/README.md) — the other major web federation protocol; compare
  [SP-initiated SSO](../saml/sp-initiated-sso/README.md) with [authorization-code](authorization-code/README.md).
- [Tokenless patterns](../tokenless/README.md) — session cookies, mTLS, and other non-token schemes.
- [Reference architecture](../architecture/identity-provider-reference-architecture/README.md) — where the OIDC IdP sits in a full IAM estate.

## More diagrams

- [DPoP — Demonstrating Proof of Possession (RFC 9449)](./dpop/README.md)
- [OAuth 2.0 Dynamic Client Registration (RFC 7591 / RFC 7592)](./dynamic-client-registration/README.md)
- [JWT-Secured Authorization Request (JAR, RFC 9101) and Response Mode (JARM)](./jar-jarm/README.md)
- [OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens (RFC 8705)](./mtls-bound-tokens/README.md)
- [Pushed Authorization Requests (PAR, RFC 9126)](./pushed-authorization-requests/README.md)
- [Resource Owner Password Credentials (ROPC) Grant](./resource-owner-password-credentials/README.md)
- [Rich Authorization Requests (RAR, RFC 9396)](./rich-authorization-requests/README.md)
- [OpenID Connect Session Management 1.0](./session-management/README.md)
- [OAuth 2.0 Token Exchange (RFC 8693)](./token-exchange/README.md)
- [OAuth 2.0 Token Introspection (RFC 7662)](./token-introspection/README.md)
- [OAuth 2.0 Token Revocation (RFC 7009)](./token-revocation/README.md)
