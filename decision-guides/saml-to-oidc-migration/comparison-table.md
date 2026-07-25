# SAML vs OIDC (Migration) — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **Build new on OIDC** | ✅ Current | Any new federation integration | Only if the SP genuinely cannot speak OIDC | JSON/JWT, mobile/SPA/API friendly, simpler discovery + key rotation | Use Authorization Code + PKCE; validate `iss`/`aud`/`nonce`; rotate keys via JWKS |
| **Migrate SP to OIDC** | ✅ Current | Existing SP that supports OIDC and you can cut over | SP with no OIDC support or a hard SAML mandate | One-time integration + testing cost; retires SAML metadata/cert choreography | Map SAML `NameID`/attributes to OIDC `sub`/claims carefully; keep user matching stable across the cut |
| **Coexistence (dual-protocol)** | ✅ Current | Phased migration of a large user base or many SPs | Small single-app cutovers where parallel run is needless overhead | IdP maintains both endpoints; per-app cutover; SAML retired app-by-app | Keep a single source of identity truth; ensure both protocols resolve to the same account to avoid split identities |
| **Keep SAML** | 🟡 Legacy | SP only speaks SAML, or a mandate requires SAML assertions | New greenfield builds | Mature and widely supported, but XML-DSig, canonicalization, and POST bindings are heavier and bug-prone | **Why legacy:** XML-signature/canonicalization pitfalls (wrapping, comment-injection), heavier tooling. **Use instead:** OIDC (Authorization Code + PKCE) once the SP supports it |

Notes

- SAML is **not being deleted** — it stays valid where an app only speaks it and for stable
  existing estates. The 🟡 status means "don't start here for new work", not "rip it out".
- The realistic migration shape is **coexistence then per-app cutover**: stand up the OIDC
  endpoint, move SPs one at a time, and retire each SAML integration only when nothing depends
  on it.
- The riskiest part of migration is **identity mapping**: a user authenticated via SAML
  `NameID` and the same user via OIDC `sub` must resolve to one account. Pin the mapping before
  cutover to avoid duplicate or hijacked accounts.
- Once you have chosen OIDC, use [Choosing an OAuth 2.0 Grant](../choosing-an-oauth-grant/README.md)
  to pick the specific grant.
