# Choosing an OAuth 2.0 Grant

**Status:** ✅ Current

Once you have chosen OIDC/OAuth 2.0 (see
[Choosing an authentication protocol](../choosing-an-authentication-protocol/README.md)),
this guide picks the **grant type** by client type and interactivity:

- SPA / native / mobile (public client) → **Authorization Code + PKCE**
- Server-side web app (confidential client) → **Authorization Code** (with a secret; still add PKCE)
- Machine / daemon (no user) → **Client Credentials**
- Input-constrained device (TV, CLI, IoT) → **Device Authorization Grant**
- Decoupled / out-of-band approval → **CIBA** (Client-Initiated Backchannel Authentication)

Two legacy grants are deprecated and appear as ⛔ leaves: **Implicit** and **Resource
Owner Password Credentials (ROPC)**.

## How to use this guide

1. Walk [flowchart.md](flowchart.md): first "is there a user?", then the client's ability
   to hold a secret and render a browser.
2. Follow the leaf's **Leaf link** to the concrete flow.
3. Check [comparison-table.md](comparison-table.md) for tradeoffs and the deprecation
   rationale.

## Options at a glance

- ✅ **Authorization Code + PKCE** — public clients (SPA, native, mobile). The default.
- ✅ **Authorization Code (confidential)** — server web apps that can keep a secret.
- ✅ **Client Credentials** — machine-to-machine, no user present.
- 🔵 **Device Authorization Grant** — browserless / input-constrained devices.
- 🔵 **CIBA** — decoupled approval on a separate authentication device.
- ⛔ **Implicit** — tokens returned in the redirect fragment. **Use instead:**
  Authorization Code + PKCE.
- ⛔ **ROPC** — app collects the user's password directly. **Use instead:**
  Authorization Code + PKCE.

## Related diagrams

- [Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md)
- [Authorization Code (confidential)](../../oidc/authorization-code/README.md)
- [Client Credentials](../../oidc/client-credentials/README.md)
- [Device Authorization](../../oidc/device-authorization/README.md)
- [CIBA](../../oidc/ciba/README.md)
- [Implicit](../../oidc/implicit/README.md) — deprecated, kept for reference.
- [Refresh Token](../../oidc/refresh-token/README.md) — pairs with the interactive grants.

## Files

- [flowchart.md](flowchart.md) — the decision tree.
- [comparison-table.md](comparison-table.md) — grant-by-grant tradeoffs and status.
