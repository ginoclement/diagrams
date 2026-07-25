---
title: "IP Allowlist / Network-Location Authentication — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IP Allowlist / Network-Location Authentication — Client Snippets

Client snippets showing how network-location "authentication" behaves on and off the
allowed network. All hosts and addresses are **synthetic** placeholders. Note the
defining feature: **there is no credential and no token** — the source IP is the only
signal.

## 1. Request from an allowed IP (on-network / VPN)

```bash
# No Authorization header, no cookie, no token. The gateway allows it purely because
# the source IP is inside the allowlisted range (e.g. office/VPN egress).
curl -i https://admin.example.com/panel
# -> 200 OK   (allowed: peer address is in the allowlist)
```

## 2. Request from a disallowed IP (off-network)

```bash
# Same request, different network path. The gateway drops or rejects it.
curl -i https://admin.example.com/panel
# -> 403 Forbidden   (source IP not in the allowlist)
# Ideally the service is not even discoverable (connection times out / reset)
# rather than returning a polite 403.
```

## 3. Why a spoofed `X-Forwarded-For` must NOT be trusted

```bash
# An attacker sets X-Forwarded-For hoping the gateway trusts it as the source IP.
curl -i https://admin.example.com/panel \
  -H "X-Forwarded-For: 10.0.0.5"
# EXPECTED: ignored. X-Forwarded-For is client-controlled; the gateway must decide on
# the TRANSPORT peer address (or a header set by an infra hop it owns), never a
# client-supplied one.
```

## 4. Recommended combination: allowlist as a filter, real auth on top

```bash
# On-network passes the IP filter but the app STILL requires login.
curl -i -b "sid=synthSESSION-1a2b" https://admin.example.com/panel
# -> 200 OK only if BOTH: source IP allowed AND a valid session/credential present.
# Allowlist = defense-in-depth, not authentication.
```

## SDK / library example (Express: trust the peer address, not the header)

```js
import express from "express";
const app = express();

// Only trust X-Forwarded-For hops YOU control (your edge). Here: none trusted,
// so req.ip is the real transport peer address.
app.set("trust proxy", false);

const ALLOW = ["203.0.113.0/24"]; // synthetic office/VPN egress (RFC 5737 doc range)
import { BlockList } from "node:net";
const list = new BlockList();
list.addSubnet("203.0.113.0", 24);

app.use((req, res, next) => {
  if (!list.check(req.socket.remoteAddress)) {
    return res.status(403).json({ error: "not on an allowed network" });
  }
  next(); // allowlist passed — now do REAL authentication before granting access
});
```

---

**Synthetic note:** all addresses use the reserved documentation ranges
(`203.0.113.0/24`, `10.0.0.0/8` private) per RFC 5737 / RFC 1918. `sid` is fabricated.
No real IPs, credentials, or PII appear here.
