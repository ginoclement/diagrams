---
title: "Header-Based SSO (Proxy-Injected Identity Headers)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Header-Based SSO (Proxy-Injected Identity Headers)

**Status:** ✅ Current

A reverse proxy or access gateway authenticates the user (by any means — form login,
SAML, OIDC, Kerberos, mTLS) and then forwards requests to backend applications with
**identity headers injected**: `REMOTE_USER`, `X-Forwarded-User`, `X-Auth-Request-Email`,
etc. The application performs no authentication of its own; it simply trusts the
header. The entire security model rests on one invariant: **only the proxy can reach
the app, and the proxy always strips/overwrites those headers on inbound traffic.**

## When it's used

- Retrofitting SSO onto legacy or third-party apps that cannot speak SAML/OIDC
  (classic Apache `mod_auth` + `REMOTE_USER`, SiteMinder, oauth2-proxy, Pomerium,
  Cloudflare Access, Identity-Aware Proxy patterns).
- Kubernetes ingress gateways centralizing authentication for many small services.
- Internal tools behind a corporate access proxy.

## Actors

| Actor | Role |
|---|---|
| User | Human accessing the app |
| Browser | User agent |
| Proxy | Reverse proxy / access gateway performing authentication and header injection |
| IdP | Where the proxy sends the user to authenticate (form, OIDC, SAML) |
| App | Backend application trusting the injected headers |

## Alternate scenarios covered

- **Spoofed header direct-to-app** — attacker bypasses the proxy and sends
  `X-Forwarded-User: admin` straight to the app; blocked by network policy
  (and defense-in-depth: app only accepts the header from the proxy's address or over
  an mTLS link).
- **Unauthenticated request** — no proxy session; proxy redirects the user to login
  before any request reaches the app.

## Security notes

- **The proxy-to-app link is the trust boundary.** Enforce it with network policy
  (app reachable *only* from the proxy: firewall rules, network segmentation, service
  mesh policy) and ideally authenticate the link itself with
  [mTLS](../mutual-tls/README.md) or a signed header (e.g. a JWT the app verifies —
  at which point the pattern stops being tokenless).
- **Strip inbound identity headers at the proxy, always.** The classic vulnerability
  is a proxy that injects `X-Forwarded-User` when it authenticates but passes a
  client-supplied copy through when it does not.
- Watch for **header-smuggling variants**: underscore vs dash normalization
  (`X_Forwarded_User`), duplicate headers, HTTP/1.1 vs HTTP/2 case differences —
  strip by canonicalized name.
- The app should log the peer address and reject identity headers arriving from any
  source other than the proxy.
- Session lifetime and logout live at the proxy; apps should not build a second,
  longer-lived session from the header.

## Diagrams

- [sequence.md](./sequence.md) — proxy login, header injection, and the spoofing/unauthenticated alts.
- [swimlane.md](./swimlane.md) — lanes for User, Browser, Proxy, IdP, App with the trust boundary visible.
- [flowchart.md](./flowchart.md) — decision logic at proxy and app, including the network-policy block.

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Related diagrams

- [session-cookie](../session-cookie/README.md) — the proxy's own session with the browser is usually cookie-based.
- [mutual-tls](../mutual-tls/README.md) — hardening the proxy-to-app hop.
- [ip-allowlist-network-auth](../ip-allowlist-network-auth/README.md) — the network-reachability assumption this pattern depends on.
- [DMZ segmentation](../../../infrastructure/network-security/network-segmentation-dmz/README.md) — network layout that enforces the trust boundary.
- [ForgeRock CDSSO](../../../platforms/platform-specific/forgerock-authentication-journey/README.md) — a productized gateway/agent variant of this pattern.
