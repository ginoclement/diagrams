---
title: "Tokenless Authentication Patterns"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Tokenless Authentication Patterns

"Tokenless" here means authentication patterns that do **not** rely on an issued bearer
token or signed assertion handed to the client (no SAML assertions, no JWTs, no OAuth
access/refresh tokens). Instead, the proof of identity is carried by something else:
an opaque server-side session reference, credentials replayed on every request, the
transport layer itself (client certificates, network location), a trusted intermediary
(identity headers injected by a proxy), or a possession/biometric ceremony (magic links,
passkeys). These patterns predate — and in many deployments still coexist with — the
federated token-based flows in [saml/](../saml/) and [oidc/](../oidc/), and understanding
their trust boundaries is essential when reviewing legacy systems, internal tools, and
service-to-service traffic.

## Diagrams

| Diagram | Description |
|---|---|
| [session-cookie](session-cookie/README.md) | Classic form login establishing a server-side session, referenced by an opaque HttpOnly/Secure/SameSite cookie; session-ID rotation and CSRF defenses. |
| [http-basic-auth](http-basic-auth/README.md) | HTTP Basic (and Digest) challenge-response: credentials sent on every request after a 401 WWW-Authenticate challenge; TLS-only by necessity. |
| [mutual-tls](mutual-tls/README.md) | mTLS client-certificate authentication inside the TLS handshake: CertificateRequest, CertificateVerify, chain/EKU/revocation checks, cert-to-identity mapping. |
| [header-based-sso](header-based-sso/README.md) | Reverse-proxy / gateway injected identity headers (REMOTE_USER, X-Forwarded-User) after proxy-level authentication; the proxy-to-app trust boundary. |
| [ip-allowlist-network-auth](ip-allowlist-network-auth/README.md) | Network-location-based access: IP allowlists and VPN/private-network reachability as implicit authentication, and its limits versus zero trust. |
| [magic-link](magic-link/README.md) | Passwordless email magic link: single-use, time-limited signed link that verifies the user and establishes a session. |
| [webauthn-passkey-authentication](webauthn-passkey-authentication/README.md) | WebAuthn/FIDO2 authentication ceremony: server challenge, authenticator user verification, signed assertion validated against the stored public key. |

## Related categories

- [oidc/](../oidc/) — token-based delegated authorization and federated login.
- [saml/](../saml/) — assertion-based enterprise federation.
- [kerberos/](../kerberos/) — ticket-based authentication in Windows/AD environments.
- [network-security/zero-trust-network-access](../architecture/zero-trust-architecture/README.md) — the modern replacement for network-location-based trust.
- [enrollment/passkey-enrollment](../enrollment-and-update/fido2-passkey-registration/README.md) — how the credentials used in the WebAuthn ceremony get created.
