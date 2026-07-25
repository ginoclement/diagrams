---
title: "SAML-to-OIDC Migration — Decision Tree"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SAML-to-OIDC Migration — Decision Tree

Leaves name the recommended path; SAML is 🟡 legacy with OIDC as the target.

```mermaid
flowchart TD
    S(["Federation integration<br/>decision"]) --> Q1{"New integration or<br/>existing SAML SP?"}

    Q1 -->|New integration| NEW(["Build new on OIDC<br/>(Authorization Code + PKCE)"])

    Q1 -->|Existing SAML SP| Q2{"Does the SP support<br/>OIDC (native or update)?"}
    Q2 -->|No, SAML only| Q3{"Hard mandate to<br/>stay on SAML?"}
    Q3 -->|Yes| KEEP(["🟡 Keep SAML -<br/>isolate, revisit later"])
    Q3 -->|"No, just not updated yet"| KEEP2(["🟡 Keep SAML for now -<br/>plan OIDC once SP supports it"])

    Q2 -->|Yes| Q4{"Can all users cut over<br/>in one window?"}
    Q4 -->|"No - phased population"| COEX(["Coexistence:<br/>run SAML + OIDC in parallel"])
    Q4 -->|Yes| CUT(["Migrate SP to OIDC,<br/>then retire SAML endpoint"])

    COEX --> CUT
```

Leaf links

- **Build new on OIDC** → [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md)
- **Migrate SP to OIDC** → [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md) (server-side web app: [`../../oidc/authorization-code/`](../../oidc/authorization-code/README.md))
- **Coexistence (SAML + OIDC in parallel)** → target [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md), source [`../../saml/sp-initiated-sso/`](../../saml/sp-initiated-sso/README.md)
- **🟡 Keep SAML** → [`../../saml/sp-initiated-sso/`](../../saml/sp-initiated-sso/README.md); replacement when unblocked [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md)
