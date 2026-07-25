---
title: "Header-Based SSO (Proxy-Injected Identity Headers) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Header-Based SSO (Proxy-Injected Identity Headers) — Client Snippets

Client snippets illustrating proxy-injected identity headers. All hosts, users, and
addresses are **synthetic** placeholders. The security model rests on one invariant:
**only the proxy can reach the app, and it strips/overwrites identity headers on
inbound traffic.**

## 1. Browser → proxy (the user's real request)

```bash
# The browser sends NO identity header. It authenticates to the proxy via the
# proxy's own session cookie (set when the user logged in through the IdP).
curl -i -b "proxy_session=synthAUTH-7f3a" https://app.example.com/reports
# -> 200 OK   (the app response, fetched by the proxy on the user's behalf)
```

## 2. Proxy → app (what the backend actually receives)

```bash
# Simulating the proxy's inbound request to the backend, with identity injected.
# The app trusts these because they arrive ONLY from the proxy's address.
curl -i http://orders-app.internal.svc/reports \
  -H "X-Forwarded-User: alice" \
  -H "X-Auth-Request-Email: alice@example.com" \
  -H "X-Forwarded-Groups: reports-viewers,staff" \
  -H "REMOTE_USER: alice"
# -> 200 OK   {"user":"alice","via":"proxy"}
```

## 3. Spoofing attempt straight to the app (must be blocked)

```bash
# Attacker bypasses the proxy and forges the identity header.
curl -i http://orders-app.internal.svc/reports \
  -H "X-Forwarded-User: admin"
# EXPECTED: refused — network policy makes the app reachable ONLY from the proxy,
# and/or the app rejects identity headers whose peer address is not the proxy.
# -> 403 Forbidden  {"error":"identity header from untrusted source"}
```

## SDK / library example (oauth2-proxy style upstream, Node/Express app)

```js
// The backend app performs NO authentication of its own; it trusts the proxy header,
// but ONLY when the request came from the proxy's address (defense in depth).
import express from "express";
const app = express();

const PROXY_IPS = new Set(["10.0.0.10"]); // the reverse proxy, synthetic

app.use((req, res, next) => {
  const peer = req.socket.remoteAddress; // transport peer, not a spoofable header
  if (!PROXY_IPS.has(peer)) {
    return res.status(403).json({ error: "identity header from untrusted source" });
  }
  // Canonicalize to defeat header-smuggling (underscore vs dash, dupes).
  req.user = req.get("X-Forwarded-User"); // "alice"
  next();
});

app.get("/reports", (req, res) => res.json({ user: req.user, via: "proxy" }));
```

---

**Synthetic note:** `alice`, the proxy session, the `10.0.0.10` address, and the
group names are fabricated for documentation. No real users, addresses, or secrets
appear here.
