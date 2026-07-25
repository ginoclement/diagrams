---
title: "Choosing an Authentication Protocol — Decision Tree"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing an Authentication Protocol — Decision Tree

Leaves are rounded nodes naming the recommended protocol. Selection criteria are diamonds.

```mermaid
flowchart TD
    S(["Need to authenticate a caller"]) --> Q1{"Human user<br/>or machine?"}

    Q1 -->|Machine / service| Q2{"Certificate-based<br/>trust available?"}
    Q2 -->|Yes| MTLS(["Use Tokenless: Mutual TLS"])
    Q2 -->|No| Q3{"Needs a token from<br/>an authz server?"}
    Q3 -->|Yes| CC(["Use OIDC: client credentials<br/>(see OAuth grant guide)"])
    Q3 -->|No - shared secret ok| KEY(["Use Tokenless: API key / session"])

    Q1 -->|Human user| Q4{"Enterprise IdP already<br/>standardized on SAML?"}
    Q4 -->|Yes - workforce SSO| SAML(["Use SAML 2.0 - 🟡 Legacy for<br/>new consumer apps"])
    Q4 -->|No| Q5{"Domain-joined intranet app<br/>on a trusted network?"}

    Q5 -->|Yes - Windows / Kerberos realm| KRB(["Use Kerberos - SPNEGO"])
    Q5 -->|No - internet-facing| Q6{"Federated / third-party<br/>login needed?"}

    Q6 -->|Yes - SSO or social| OIDC(["Use OIDC - Authorization Code + PKCE"])
    Q6 -->|No - single first-party app| Q7{"Simple session<br/>is enough?"}
    Q7 -->|Yes| SESS(["Use Tokenless: Session cookie"])
    Q7 -->|No - APIs / mobile too| OIDC
```

Leaf links

- **Use OIDC - Authorization Code + PKCE** → [`../../oidc/authorization-code-pkce/`](../../../authentication/oidc/authorization-code-pkce/README.md)
- **Use OIDC: client credentials** → [`../../oidc/client-credentials/`](../../../authentication/oidc/client-credentials/README.md) (and the [OAuth grant guide](../choosing-an-oauth-grant/README.md))
- **Use SAML 2.0** → [`../../saml/sp-initiated-sso/`](../../../authentication/saml/sp-initiated-sso/README.md)
- **Use Kerberos - SPNEGO** → [`../../kerberos/spnego-http/`](../../../authentication/kerberos/spnego-http/README.md)
- **Use Tokenless: Mutual TLS** → [`../../tokenless/mutual-tls/`](../../../authentication/tokenless/mutual-tls/README.md)
- **Use Tokenless: Session cookie** → [`../../tokenless/session-cookie/`](../../../authentication/tokenless/session-cookie/README.md)
- **Use Tokenless: API key / session** → [`../../tokenless/session-cookie/`](../../../authentication/tokenless/session-cookie/README.md)
