---
title: "Choosing Session vs Token"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing Session vs Token

**Status:** ✅ Current

How should you represent an authenticated session: a **server-side session cookie**
(opaque ID, state in the store), a **stateless JWT** (self-contained, verified by
signature), or a **reference token + introspection** (opaque token the API introspects at
the authorization server)? The tension is **revocation and freshness** vs **scale and
statelessness**, plus the browser-security shape (XSS vs CSRF).

## How to use this guide

1. Walk [flowchart.md](flowchart.md): start from browser-first vs API/first-party, then
   how hard immediate revocation must be, then scale.
2. Follow the leaf's **Leaf link** to a representative flow.
3. Confirm tradeoffs in [comparison-table.md](comparison-table.md).

## Options at a glance

- ✅ **Server-side session cookie** — opaque ID in an `HttpOnly` cookie; state lives in a
  session store. Instant revocation; best for classic first-party web apps.
- ✅ **Stateless JWT** — self-contained signed token verified locally. Scales without a
  central lookup; revocation is hard (needs short TTLs + a denylist).
- 🔵 **Reference token + introspection** — opaque bearer token; each API call (or a cache)
  introspects at the authorization server. Central revocation with token opacity.

## Related diagrams

- [Session cookie](../../tokenless/session-cookie/README.md)
- [Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — issues JWT/access tokens.
- [Authorization Code (confidential)](../../oidc/authorization-code/README.md) — server-side token handling.
- [Scopes, claims, entitlements](../../authorization/scopes-claims-entitlements/README.md) — what a token carries.

## Files

- [flowchart.md](flowchart.md) — the decision tree.
- [comparison-table.md](comparison-table.md) — session-representation tradeoffs.
