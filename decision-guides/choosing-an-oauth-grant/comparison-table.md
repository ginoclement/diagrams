# OAuth 2.0 Grants — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **Authorization Code + PKCE** | ✅ Current | Public clients: SPA, native, mobile | Machine-to-machine with no user | Redirect round-trip, but no secret needed | PKCE `S256`; validate `state`/`nonce`; rotate refresh tokens |
| **Authorization Code (confidential)** | ✅ Current | Server-side web apps that can store a secret | Browserless or public clients | Most robust; needs secure secret storage | Add PKCE anyway; short-lived access tokens |
| **Client Credentials** | ✅ Current | Daemons, cron, service-to-service, no user | Anything acting on a user's behalf | Simple; no user context or consent | Scope tightly; prefer mTLS or private_key_jwt client auth |
| **Device Authorization Grant** | 🔵 Emerging | TVs, CLIs, IoT — input-constrained devices | Devices that can host a full browser | User completes on a second device; polling latency | Show/verify user_code; rate-limit token polling |
| **CIBA** | 🔵 Emerging | Decoupled approval (call-center, push-to-approve) | Simple in-browser logins | Backchannel, no redirect; needs a registered auth device | Bind requests; authenticate the client strongly |
| **Implicit** | ⛔ Deprecated | — | Any new client | Tokens in URL fragment, no refresh | **Why:** token leakage via history/referrer, no PKCE. **Use instead:** Authorization Code + PKCE |
| **ROPC (password)** | ⛔ Deprecated | — | Any new client | App handles the raw password | **Why:** defeats SSO/MFA/consent, phishing-shaped. **Use instead:** Authorization Code + PKCE |

Notes

- PKCE is now recommended for **all** clients including confidential ones (OAuth 2.0
  Security BCP) as code-injection defense.
- Refresh tokens pair with the interactive grants; for public clients rotate them on every
  use — see [Refresh Token](../../oidc/refresh-token/README.md).
