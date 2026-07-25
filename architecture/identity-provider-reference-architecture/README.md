# Identity Provider (IdP) Reference Architecture

**Status:** ✅ Current

## What it shows

The internal component topology of a modern Identity Provider — the system that
authenticates users, mints tokens/assertions, and federates identity to relying
applications. It decomposes the IdP into its planes (edge, authentication, token,
session, directory, factor, policy/admin, audit, and external federation) and draws
the **trust boundaries** between them, so you can see which components hold secrets,
which are internet-facing, and where a compromise is contained.

This is an architecture (topology) view, not a single protocol message flow. The
protocol flows that run *through* this architecture live in the [OIDC](../../oidc/authorization-code-pkce/README.md)
and [SAML](../../saml/sp-initiated-sso/README.md) categories.

## Actors / components

| Component | Role |
|---|---|
| Browser / App | Relying-party user agent or native client that starts an authentication request |
| Relying Party (RP/SP) | Application that trusts the IdP; consumes tokens or assertions |
| Edge / TLS Gateway | Public entry point: TLS termination, WAF, rate limiting, request routing |
| Authentication Service | Runs the login ceremony; verifies primary credentials and orchestrates factors |
| Factor / MFA Service | Evaluates second factors — TOTP, push, WebAuthn/passkey, SMS/voice |
| Token / Assertion Service | Issues OIDC ID/access tokens (JWT) and SAML assertions; holds signing keys |
| Session Store | Server-side IdP SSO session state; enables seamless SSO and single logout |
| User Directory | Authoritative user store: identities, credential hashes, group/role membership |
| Policy / Admin Plane | Admin console + policy engine: authenticators, MFA rules, app assignments |
| Audit / Logging | Tamper-evident event log of every authN/authZ and admin action |
| Signing Key Store / HSM | Protects the private keys used to sign tokens and assertions |
| External IdPs | Upstream social/enterprise IdPs reached via inbound federation |

## Trust boundaries & security notes

- **Public boundary (untrusted → edge):** only the Edge/TLS Gateway is internet-facing.
  TLS terminates here; a WAF and rate limiter blunt credential-stuffing and DoS before
  traffic reaches the auth service.
- **Application/control boundary:** the Authentication, Token, Session and Factor
  services sit behind the edge and never accept direct public traffic. They talk to
  data stores over an internal, mutually authenticated network — see the
  [mTLS service mesh](../../network-security/mtls-service-mesh/README.md) pattern.
- **Signing keys are the crown jewels:** the Token/Assertion Service signs with private
  keys held in an [HSM or KMS](../pki-hierarchy/README.md). Keys never leave the boundary;
  rotate them and publish the public half via JWKS / SAML metadata.
- **Directory holds credential material:** password hashes (Argon2/bcrypt) and factor
  secrets live in the User Directory. It is the highest-value data store and is isolated
  in the data tier with the tightest access controls.
- **Management plane is separate:** admin/policy changes flow through their own
  authenticated, audited path. Admin access must itself be MFA-protected and logged.
- **Audit is append-only:** every authentication, token issuance, and policy change is
  written to a tamper-evident log for detection and forensics.
- **Session vs token:** the Session Store is the IdP's own SSO session (long-lived,
  revocable), distinct from the short-lived tokens the Token Service mints for RPs.

## Related diagrams

- [Federation topology](../federation-topology/README.md) — many IdPs/SPs brokered through a hub
- [Zero trust architecture](../zero-trust-architecture/README.md) — where this IdP feeds the policy engine
- [Secrets management](../secrets-management/README.md) — how the signing keys and service secrets are protected
- [PKI hierarchy](../pki-hierarchy/README.md) — the CA/HSM trust chain behind signing keys
- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — a login flow through this IdP
- [SAML SP-initiated SSO](../../saml/sp-initiated-sso/README.md) — a federation flow through this IdP

## Files

- [sequence.md](sequence.md) — a login request traversing the IdP's internal components
- [swimlane.md](swimlane.md) — components placed in edge / app / data / management zones
- [flowchart.md](flowchart.md) — the IdP's authentication + token-issuance decision path
