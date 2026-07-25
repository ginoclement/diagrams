---
title: "Front-Channel Logout — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Front-Channel Logout — Client Snippets

Runnable snippets for OIDC Front-Channel Logout 1.0. Here the OpenID Provider renders a
hidden `<iframe>` per logged-in RP; each frame loads that RP's `frontchannel_logout_uri`
with `iss` and `sid` query parameters, and the RP clears its local session as the frame
loads. Everything happens **through the browser** — see [README](./README.md).

## 1. The per-RP iframe request (what the browser issues)

```bash
# The browser loads this for each RP; the RP clears the matching session and returns 200.
curl -i 'https://rp1.example.com/frontchannel-logout?iss=https%3A%2F%2Fidp.example.com&sid=abc123session'

# iss and sid are sent together or not at all. The RP compares sid to the sid claim
# it received in that user's ID token before clearing anything.
```

## 2. Fetch the IdP logout page that hosts the frames

```bash
# The end_session flow returns an HTML page whose body contains one hidden iframe per RP.
curl -s 'https://idp.example.com/end_session?id_token_hint=eyJ...&post_logout_redirect_uri=https%3A%2F%2Frp1.example.com%2Floggedout' \
  | grep -o '<iframe[^>]*src="[^"]*"'
# <iframe src="https://rp1.example.com/frontchannel-logout?iss=https://idp.example.com&sid=abc123session"
# <iframe src="https://rp2.example.com/frontchannel-logout?iss=https://idp.example.com&sid=abc123session"
```

## 3. Confirm front-channel support in discovery metadata

```bash
curl -s 'https://idp.example.com/.well-known/openid-configuration' \
  | tr ',' '\n' | grep -i 'frontchannel_logout'
# frontchannel_logout_supported: true
# frontchannel_logout_session_supported: true
```

## SDK example (Node.js — RP handling the iframe logout request)

```js
// npm i express
import express from "express";
const app = express();

const ISSUER = "https://idp.example.com";

app.get("/frontchannel-logout", (req, res) => {
  const { iss, sid } = req.query;

  // If frontchannel_logout_session_required, iss AND sid must be present and match.
  if (!iss || !sid) {
    // Missing required params — treat as possible logout CSRF, do nothing.
    return res.status(400).set("Cache-Control", "no-store").end();
  }
  if (iss !== ISSUER) return res.status(400).end();

  // Only clear the local session whose stored sid matches; do nothing else
  // (no redirects, no revoking other users) from this unauthenticated GET.
  clearLocalSessionBySid(sid);

  // Return a tiny page. Frame-ability matters: do NOT send X-Frame-Options: DENY here.
  res.set("Cache-Control", "no-store").type("html").send("<!doctype html><title>bye</title>");
});

function clearLocalSessionBySid(sid) { /* delete server-side session + Set-Cookie clear */ }
```

> **All values here are synthetic.** The `sid` (`abc123session`), issuer, `client_id`,
> and any token fragments are sanitized placeholders. Never paste a real `sid`, session
> cookie, or ID token into these files.
