# Choosing an OAuth 2.0 Grant — Decision Tree

Leaves name the recommended grant; deprecated grants are ⛔ with their replacement.

```mermaid
flowchart TD
    S(["Need an OAuth 2.0 / OIDC token"]) --> Q1{"Is a human user<br/>present at sign-in?"}

    Q1 -->|No user - machine| CC(["Use Client Credentials"])

    Q1 -->|Yes - user present| Q2{"Can the device render<br/>an interactive browser?"}
    Q2 -->|No - TV, CLI, IoT| DEV(["Use Device Authorization Grant"])
    Q2 -->|Approval on a separate device| CIBA(["Use CIBA"])

    Q2 -->|Yes - has a browser| Q3{"Can the client keep<br/>a secret confidential?"}
    Q3 -->|No - SPA, native, mobile| PKCE(["Use Authorization Code + PKCE"])
    Q3 -->|Yes - server-side web app| CONF(["Use Authorization Code<br/>confidential + PKCE"])

    S --> LEG{"Considering a<br/>legacy grant?"}
    LEG -->|Implicit| IMP(["⛔ Implicit -<br/>use Authorization Code + PKCE"])
    LEG -->|Password / ROPC| ROPC(["⛔ ROPC -<br/>use Authorization Code + PKCE"])
```

Leaf links

- **Use Authorization Code + PKCE** → [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md)
- **Use Authorization Code confidential + PKCE** → [`../../oidc/authorization-code/`](../../oidc/authorization-code/README.md)
- **Use Client Credentials** → [`../../oidc/client-credentials/`](../../oidc/client-credentials/README.md)
- **Use Device Authorization Grant** → [`../../oidc/device-authorization/`](../../oidc/device-authorization/README.md)
- **Use CIBA** → [`../../oidc/ciba/`](../../oidc/ciba/README.md)
- **⛔ Implicit** → replacement [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md) (reference: [`../../oidc/implicit/`](../../oidc/implicit/README.md))
- **⛔ ROPC** → replacement [`../../oidc/authorization-code-pkce/`](../../oidc/authorization-code-pkce/README.md)
