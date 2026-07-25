---
title: "RP-Initiated Logout — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RP-Initiated Logout — Client Snippets

Runnable snippets for OIDC RP-Initiated Logout 1.0. The RP clears its own session, then
redirects the browser to the IdP `end_session_endpoint` with `id_token_hint` and
`post_logout_redirect_uri`; the IdP ends its SSO session and redirects back. See
[README](./README.md).

## 1. The RP local-logout endpoint (issues the redirect)

```bash
# Hitting the RP's own logout kills the local session and 302s to the IdP end_session_endpoint.
curl -i 'https://rp1.example.com/logout' -b 'rp1_session=SYNTHETIC-rp1-session'
# HTTP/1.1 302 Found
# Set-Cookie: rp1_session=; Max-Age=0; ...
# Location: https://idp.example.com/end_session?id_token_hint=eyJ...&post_logout_redirect_uri=https%3A%2F%2Frp1.example.com%2Floggedout&state=af0ifjsldkj
```

## 2. The IdP end_session request (what the browser follows)

```bash
curl -i -G 'https://idp.example.com/end_session' \
  --data-urlencode 'id_token_hint=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDM2MDAsImlhdCI6MTc3NDAwMDAwMCwiYXV0aF90aW1lIjoxNzczOTk5OTAwLCJub25jZSI6Im4tMFM2X1d6QTJNaiIsInNpZCI6ImFiYzEyM3Nlc3Npb24iLCJhY3IiOiJ1cm46bWFjZTppbmNvbW1vbjppYXA6c2lsdmVyIiwiYW1yIjpbInB3ZCIsIm90cCJdLCJlbWFpbCI6ImpvcmRhbi5yaXZlcmFAZXhhbXBsZS5jb20ifQ.SIG_synthetic_not_a_real_signature_do_not_verify' \
  --data-urlencode 'post_logout_redirect_uri=https://rp1.example.com/loggedout' \
  --data-urlencode 'state=af0ifjsldkj' \
  -b 'idp_session=SYNTHETIC-idp-session-cookie'
# HTTP/1.1 302 Found
# Location: https://rp1.example.com/loggedout?state=af0ifjsldkj   (only if URI is registered)
```

## 3. Discover the end_session_endpoint

```bash
curl -s 'https://idp.example.com/.well-known/openid-configuration' \
  | grep -o '"end_session_endpoint":"[^"]*"'
# "end_session_endpoint":"https://idp.example.com/end_session"
```

## SDK example (Node.js — building the logout redirect with openid-client)

```js
// npm i openid-client express
import express from "express";
import { Issuer } from "openid-client";

const app = express();
const issuer = await Issuer.discover("https://idp.example.com");
const client = new issuer.Client({
  client_id: "s6BhdRkqt3",
  post_logout_redirect_uris: ["https://rp1.example.com/loggedout"],
});

app.get("/logout", (req, res) => {
  const idToken = req.session.id_token;      // the ID token this RP received at login
  const state = "af0ifjsldkj";               // store to verify on the return leg

  // Destroy the local session BEFORE redirecting, so logout holds even if the user
  // never returns from the IdP.
  req.session.destroy(() => {
    const endSessionUrl = client.endSessionUrl({
      id_token_hint: idToken,
      post_logout_redirect_uri: "https://rp1.example.com/loggedout",
      state,
    });
    res.redirect(endSessionUrl);
  });
});

app.get("/loggedout", (req, res) => {
  // Verify state echoed back matches what we stored (CSRF-safe round trip).
  res.send("You have been logged out.");
});
```

> **All values here are synthetic.** The `id_token_hint`, `state`, `client_id`, `sub`,
> and cookies are sanitized placeholders; the signature segment is
> `SIG_synthetic_not_a_real_signature_do_not_verify`. Never paste a real ID token or
> session cookie into these files.
