# SAML-to-OIDC Migration

**Status:** ✅ Current

This guide helps decide **whether and how** to move a federation integration from **SAML 2.0**
to **OpenID Connect (OIDC)** — for new builds, for existing SPs, and for estates that must run
both during a transition.

The default direction of travel is clear: for **new** integrations, build on **OIDC**. SAML is
**🟡 Legacy** — still valid and widely deployed, and sometimes the only protocol an enterprise
SaaS app speaks, but not the choice for greenfield work. OIDC's JSON/JWT, mobile- and
SPA-friendly flows, and simpler discovery/rotation make it the modern target; SAML's XML
signatures, XML canonicalization, and browser-POST bindings are heavier and a richer source of
implementation bugs.

Migration is rarely big-bang. The realistic pattern is **coexistence**: the IdP exposes both a
SAML and an OIDC endpoint for the same user population, SPs cut over one at a time, and SAML is
retired per-app once nothing depends on it.

## When to migrate

- The app/SP **supports OIDC** (natively or via an update) and you want mobile/SPA/API-friendly
  tokens, simpler key rotation, or a single protocol across your estate.
- You are consolidating IdPs and want to reduce the SAML surface (metadata exchange, cert
  rotation choreography, XML-signature handling).
- New capability (fine-grained scopes, DPoP/mTLS-bound tokens, token exchange) is only
  practical on the OIDC stack.

## When to stay on SAML (for now)

- The SP **only speaks SAML** and cannot be updated — keep SAML for that app and isolate it.
- A compliance/vendor requirement mandates SAML assertions specifically.
- The integration is stable, low-risk, and there is no capability gap — migrate opportunistically,
  not urgently.

## How to use this guide

1. Walk [flowchart.md](flowchart.md): new vs existing integration, OIDC support, and hard
   constraints, then the coexistence-vs-cutover decision.
2. Follow the leaf's **Leaf link** to the concrete SAML or OIDC flow.
3. Check [comparison-table.md](comparison-table.md) for the SAML-vs-OIDC tradeoffs and the
   deprecation rationale.

## Options at a glance

- ✅ **Build new on OIDC** — greenfield integrations use Authorization Code + PKCE.
- ✅ **Migrate SP to OIDC** — cut an existing SP over when it supports OIDC.
- ✅ **Coexistence (dual-protocol)** — run SAML and OIDC side by side during the transition.
- 🟡 **Keep SAML** — the app only speaks SAML or a mandate requires it; isolate and revisit.

## Related diagrams

- [SAML SP-Initiated SSO](../../saml/sp-initiated-sso/README.md) — the SAML flow being migrated from.
- [SAML IdP-Initiated SSO](../../saml/idp-initiated-sso/README.md) — the portal-launch pattern to re-home on OIDC.
- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the recommended OIDC target flow.
- [OIDC Authorization Code (confidential)](../../oidc/authorization-code/README.md) — server-side web app target.
- [Choosing an OAuth 2.0 Grant](../choosing-an-oauth-grant/README.md) — picks the OIDC grant once you land on OIDC.
- [SAML flows](../../saml/README.md) / [OIDC flows](../../oidc/README.md) — full protocol catalogs.

## Files

- [flowchart.md](flowchart.md) — the decision tree.
- [comparison-table.md](comparison-table.md) — SAML-vs-OIDC tradeoffs, coexistence, and deprecation rationale.
