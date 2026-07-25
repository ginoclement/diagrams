---
title: "Header-Based SSO (Proxy-Injected Identity Headers) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Header-Based SSO (Proxy-Injected Identity Headers) — Sample Capture

A sanitized HAR reconstructing both hops — browser↔proxy and proxy→app — plus a
spoofing attempt. **All values are synthetic.**

- Capture: [header-based-sso.har](./header-based-sso.har) (HAR 1.2)

## The four entries

| # | Hop | What it shows |
|---|---|---|
| 1 | browser → proxy | Unauthenticated → `302` redirect to the IdP; app never reached |
| 2 | browser → proxy | After login: carries only `Cookie: proxy_session=...`, **no** identity header |
| 3 | proxy → app | The proxy **injects** verified identity headers upstream |
| 4 | attacker → app | Forged `X-Forwarded-User: admin` straight to the app → `403` |

## The injected identity headers (entry 3), annotated

```
X-Forwarded-User:     alice
X-Auth-Request-Email: alice@example.com
X-Forwarded-Groups:   reports-viewers,staff
X-Forwarded-For:      203.0.113.7
```

| Header | Meaning | Trust note |
|---|---|---|
| `X-Forwarded-User` | The authenticated username the app should trust | Valid **only** because it came from the proxy; the proxy stripped any inbound copy |
| `X-Auth-Request-Email` | Verified email from the IdP | Same trust boundary |
| `X-Forwarded-Groups` | Authorization groups | App maps to permissions; do not build a longer-lived session from these |
| `X-Forwarded-For` | Original client IP (`203.0.113.7`) | Informational; trust only because your own edge set it |

## Why entry 4 is blocked

The browser (entry 2) never sends `X-Forwarded-User`; it authenticates with the proxy
session cookie. In entry 4 an attacker forges the header **directly to the app's
address**, bypassing the proxy. It is rejected because:

1. **Network policy** — the app is reachable **only** from the proxy; the attacker's
   peer address is not the proxy, so the app returns `403 identity header from
   untrusted source`.
2. **Inbound stripping** — even via the proxy, a client-supplied `X-Forwarded-User`
   is stripped/overwritten before the upstream request, so it can never reach the app
   as-is.

This is the entire security model: **only the proxy can reach the app, and it always
strips/overwrites identity headers on inbound traffic.**

---

**Synthetic note:** `alice`, the email, groups, `203.0.113.7`, and the proxy session
are fabricated for documentation. `203.0.113.0/24` is the reserved
documentation range (RFC 5737). No real users or PII appear here.
