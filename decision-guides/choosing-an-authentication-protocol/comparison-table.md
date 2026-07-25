# Authentication Protocols — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **OIDC** (on OAuth 2.0) | ✅ Current | Greenfield web, SPA, native/mobile, and federated/social login; API-fronted apps | Pure intranet Windows SSO where Kerberos is seamless; raw service-to-service where mTLS suffices | JSON/JWT, huge library and IdP support; more moving parts than a cookie | Use Authorization Code + PKCE; validate `id_token` (`iss`, `aud`, `nonce`); short-lived access tokens |
| **SAML 2.0** | 🟡 Legacy (for new consumer/greenfield apps) | Existing enterprise workforce SSO; partners/IdPs that already speak SAML | New consumer apps, mobile/native, or SPA — prefer OIDC | XML + redirect/POST bindings; verbose, but ubiquitous in enterprise | Sign and verify assertions; enforce `Audience`, `NotOnOrAfter`, `InResponseTo`, replay cache |
| **Kerberos** | ✅ Current | Domain-joined intranet apps on a trusted realm; seamless desktop SSO | Internet-facing apps; non-domain devices; cross-org federation | Silent SSO on the LAN, but tied to the realm and network location | Prefer AES; avoid unconstrained delegation; SPNEGO fallback to NTLM is ⛔ |
| **Tokenless — mutual TLS** | ✅ Current | Service-to-service auth with a managed PKI or service mesh | Human interactive login; environments without cert lifecycle tooling | Strong, no bearer token to steal; needs cert issuance/rotation | Pin/verify chains; rotate certs; SPIFFE/mesh identities help at scale |
| **Tokenless — session cookie / API key** | ✅ Current | Single first-party web app; simple machine API key | Federation, SSO across orgs, or third-party clients | Simplest to build; no federation, weaker for multi-app estates | `HttpOnly`, `Secure`, `SameSite`; CSRF defense; treat API keys as secrets |
| NTLM | ⛔ Deprecated | — | Any new design | Legacy Windows challenge/response | **Why:** weak crypto, relay/pass-the-hash. **Use instead:** Kerberos or OIDC |

Notes

- "SAML 🟡" is a build-time recommendation, not a runtime warning: SAML remains valid and
  widely deployed. For **new** consumer-facing or greenfield apps, prefer OIDC.
- Picking OIDC is only half the decision — then choose the right grant in
  [Choosing an OAuth grant](../choosing-an-oauth-grant/README.md).
