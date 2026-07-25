---
title: "Session vs Token — Comparison"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Session vs Token — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **Server-side session cookie** | ✅ Current | Classic first-party web apps; instant logout/revocation | Stateless multi-service APIs; cross-domain SPA/mobile at scale | Central state (store lookup per request); trivial revocation | `HttpOnly` + `Secure` + `SameSite`; CSRF token needed; cookie is the XSS target |
| **Stateless JWT** | ✅ Current | APIs, SPAs, mobile, microservices needing local verification | When you must revoke immediately or carry large/sensitive state | No central lookup; scales well; **revocation is hard** | Short TTL + refresh rotation; validate `iss`/`aud`/`exp`/signature; a stolen JWT is valid until expiry |
| **Reference token + introspection** | 🔵 Emerging | Central revocation with opaque tokens; sensitive APIs | Latency-critical paths without an introspection cache | Opaque to the client; per-call introspection cost | Cache introspection briefly; protect the introspection endpoint; central kill-switch |

Notes

- **Revocation:** cookie (instant) > reference token (central, near-instant) > JWT
  (only via short TTL + denylist).
- **Scale:** JWT and cached-reference scale best; server sessions add a store dependency.
- **Browser threat model:** cookies invite CSRF (mitigate with `SameSite` + tokens);
  tokens in JS-accessible storage invite XSS theft — prefer `HttpOnly` cookies or
  in-memory storage for browser clients.
