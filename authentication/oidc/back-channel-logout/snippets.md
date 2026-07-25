---
title: "Back-Channel Logout — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Back-Channel Logout — Client Snippets

Runnable snippets for the server-to-server steps of OIDC Back-Channel Logout 1.0. The
core delivery is **not** a browser request — the OpenID Provider POSTs a `logout_token`
JWT directly to each Relying Party's registered `backchannel_logout_uri`. The curls
below simulate that POST (as the IdP would send it) and the RP-side validation lookups.
See [README](./README.md) for the full flow.

## 1. IdP delivers the logout token to an RP (server-to-server POST)

```bash
# The IdP sends this to the RP's backchannel_logout_uri.
# Content-Type MUST be application/x-www-form-urlencoded; body is logout_token=<JWT>.
curl -i -X POST 'https://rp1.example.com/backchannel-logout' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'logout_token=eyJhbGciOiJSUzI1NiIsInR5cCI6ImxvZ291dCtqd3QiLCJraWQiOiJpZHAta2V5LTIwMjYifQ.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsImF1ZCI6InM2QmhkUmtxdDMiLCJpYXQiOjE3NzQwMDAwMDAsImp0aSI6ImJXSnEtbG9nb3V0LTAwMDEiLCJleHAiOjE3NzQwMDAxMjAsImV2ZW50cyI6eyJodHRwOi8vc2NoZW1hcy5vcGVuaWQubmV0L2V2ZW50L2JhY2tjaGFubmVsLWxvZ291dCI6e319LCJzdWIiOiIyNDgyODk3NjEwMDEiLCJzaWQiOiJhYmMxMjNzZXNzaW9uIn0.SIG_synthetic_not_a_real_signature_do_not_verify'

# Expected RP responses:
#   200 OK            session(s) located and destroyed (or already gone — idempotent)
#   400 Bad Request   logout_token failed validation (bad sig / aud / missing events / nonce present)
#   504 / 5xx         temporary RP failure — IdP queues and retries with backoff
```

## 2. RP fetches the IdP signing keys to verify the token (JWKS)

```bash
# The RP verifies the logout_token signature against the IdP's published keys.
curl -s 'https://idp.example.com/.well-known/openid-configuration' \
  | grep -o '"jwks_uri":"[^"]*"'
curl -s 'https://idp.example.com/jwks' -H 'Accept: application/json'
```

## 3. Inspect discovery metadata for back-channel support

```bash
curl -s 'https://idp.example.com/.well-known/openid-configuration' \
  | tr ',' '\n' | grep -i 'backchannel_logout'
# backchannel_logout_supported: true
# backchannel_logout_session_supported: true
```

## SDK example (Node.js — RP validating an inbound logout token)

```js
// npm i jose express
import express from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
app.use(express.urlencoded({ extended: false }));

const ISSUER = "https://idp.example.com";
const CLIENT_ID = "s6BhdRkqt3";
const JWKS = createRemoteJWKSet(new URL("https://idp.example.com/jwks"));
const seenJti = new Set(); // replace with a TTL cache in production

app.post("/backchannel-logout", async (req, res) => {
  try {
    const { payload } = await jwtVerify(req.body.logout_token, JWKS, {
      issuer: ISSUER,
      audience: CLIENT_ID,
      // logout tokens are short-lived; jose checks exp automatically
    });

    // Validate like an ID token, minus nonce, plus the events requirement:
    const EVT = "http://schemas.openid.net/event/backchannel-logout";
    if (!payload.events || !(EVT in payload.events)) throw new Error("missing backchannel-logout event");
    if ("nonce" in payload) throw new Error("nonce must NOT be present in a logout token");
    if (!payload.sub && !payload.sid) throw new Error("need sub and/or sid");
    if (payload.jti && seenJti.has(payload.jti)) return res.status(200).end(); // replay — idempotent
    if (payload.jti) seenJti.add(payload.jti);

    // Destroy session(s) and revoke refresh tokens:
    await destroySessions({ sid: payload.sid, sub: payload.sub });
    res.set("Cache-Control", "no-store").status(200).end();
  } catch (e) {
    // Rejecting is the correct, safe behavior — never act on an unvalidated token.
    res.status(400).json({ error: "invalid_request", error_description: e.message });
  }
});

async function destroySessions({ sid, sub }) { /* look up by sid or sub, delete */ }
```

> **All values here are synthetic.** The token, keys, issuer, `client_id`, `sub`, `sid`,
> and `jti` are sanitized placeholders — the signature segment is literally
> `SIG_synthetic_not_a_real_signature_do_not_verify` and will not verify. Never paste a
> real logout token, private key, or subject identifier into these files.
