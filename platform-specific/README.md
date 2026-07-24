# platform-specific — Vendor-Specific Identity Flows

This category captures the flows that are **unique to a specific IAM product** —
the parts a vendor adds *around* the standard protocols. The generic protocol
mechanics (OIDC authorization code, PKCE, SAML SSO, the WebAuthn ceremony) live in
their own categories and are **referenced, not redrawn**, here. Each diagram focuses
on what makes its platform distinctive.

The four platforms take noticeably different approaches to the same problem —
"authenticate a user and release tokens under policy":

- **Okta (Identity Engine)** — a **policy-driven** engine. Sign-in is evaluated
  against a **Global Session Policy** and a per-app **Authentication Policy**, factors
  are **sequenced dynamically** through the `/idx` remediation loop, phishing-resistant
  **FastPass** plugs in as a device-bound factor, and flows are extended with
  synchronous **inline hooks** returning typed `commands`.
- **Auth0** — a **code-extensible** pipeline. **Universal Login** hosts the page, and
  **Actions** run Node.js at triggers (post-login, credentials-exchange) to enrich
  tokens, require MFA, deny, or redirect-and-resume. B2B tenancy is modeled with
  first-class **Organizations** (invitations, org-scoped connections and roles, the
  `organization` parameter).
- **ForgeRock / Ping** — a **graph-driven** model. Authentication is an
  **Authentication Tree / Journey** of nodes traversed via the `authId` + callbacks
  JSON API, and identity data is kept in sync by **IDM** through mappings, implicit
  sync, liveSync, and reconciliation **situations**.
- **PocketID** — a **minimalist** self-hosted OIDC provider that is
  **passkey-only**: WebAuthn is the sole first factor, users are admin-created, and
  the server issues standard OIDC tokens.

## Diagrams by vendor

### Okta

- [Okta Identity Engine Policy-Driven Sign-In](./okta-identity-engine-signin/README.md) — Global Session + Authentication Policy, `/idx` remediation, dynamic factor sequencing.
- [Okta FastPass Passwordless](./okta-fastpass-passwordless/README.md) — device-bound passwordless via loopback / universal-link probe and device attestation.
- [Okta Inline Hooks](./okta-inline-hooks/README.md) — synchronous external callouts (registration, token, SAML assertion, password import) returning `commands`.

### Auth0

- [Auth0 Universal Login + Actions](./auth0-universal-login-actions/README.md) — post-login Actions pipeline: enrich, MFA, deny, redirect-and-resume, plus M2M credentials-exchange.
- [Auth0 Organizations Invitation](./auth0-organizations-invitation/README.md) — B2B invite, accept, org-context login with the `organization` parameter and org-scoped roles.

### ForgeRock / Ping

- [ForgeRock / PingAM Authentication Journey](./forgerock-authentication-journey/README.md) — Authentication Trees: nodes, callbacks, `authId` continuation over the `/authenticate` API.
- [ForgeRock IDM Sync & Reconciliation](./forgerock-idm-sync-reconciliation/README.md) — implicit sync, liveSync, and reconciliation situations (CONFIRMED / MISSING / UNQUALIFIED / UNASSIGNED).

### PocketID

- [PocketID Passkey-Only OIDC](./pocketid-passkey-oidc/README.md) — passkey (WebAuthn) login to a self-hosted OIDC provider that then issues authorization-code tokens.

## Referenced generic diagrams

These platform flows build on the standard protocol diagrams:

- [OIDC Authorization Code + PKCE](../oidc/authorization-code-pkce/README.md)
- [OIDC Authorization Code](../oidc/authorization-code/README.md)
- [OAuth 2.0 Client Credentials](../oidc/client-credentials/README.md)
- [CIBA](../oidc/ciba/README.md)
- [SAML SP-Initiated SSO](../saml/sp-initiated-sso/README.md)
- [WebAuthn / Passkey Authentication](../tokenless/webauthn-passkey-authentication/README.md)
- [FIDO2 / Passkey Registration](../enrollment-and-update/fido2-passkey-registration/README.md)
- [SCIM Provisioning](../user-lifecycle/scim-provisioning/README.md)
