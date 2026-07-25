---
title: "OpenID Connect Session Management 1.0 — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OpenID Connect Session Management 1.0 — Client Snippets

Snippets for OIDC Session Management 1.0. The polling core is **`postMessage` between two
hidden iframes**, not HTTP — so only the discovery fetch, the `check_session_iframe` load,
and the `prompt=none` silent re-authentication are network requests. See
[README](./README.md).

## 1. Discover the check_session_iframe

```bash
curl -s 'https://idp.example.com/.well-known/openid-configuration' \
  | grep -o '"check_session_iframe":"[^"]*"'
# "check_session_iframe":"https://idp.example.com/check_session"
```

## 2. Load the OP check_session_iframe (browser embeds this hidden)

```bash
# The RP embeds this hidden iframe; the postMessage exchange with it does NOT show in the
# Network tab (it's window messaging, not HTTP).
curl -i 'https://idp.example.com/check_session'
```

## 3. Silent re-authentication after a "changed" signal (prompt=none)

```bash
# On "changed", the RP silently re-auths. If still logged in at the OP -> 302 code;
# if logged out -> 302 error=login_required.
curl -i -G 'https://idp.example.com/authorize' \
  --data-urlencode 'response_type=code' \
  --data-urlencode 'client_id=s6BhdRkqt3' \
  --data-urlencode 'redirect_uri=https://rp1.example.com/silent-cb' \
  --data-urlencode 'scope=openid' \
  --data-urlencode 'prompt=none' \
  --data-urlencode 'state=sm-state-2200' \
  --data-urlencode 'nonce=sm-reauth-9931' \
  -b 'idp_session=SYNTHETIC-idp-session-cookie'
# Success:  HTTP/1.1 302 Found  Location: https://rp1.example.com/silent-cb?code=SplxlOBeZQQ&state=sm-state-2200
# Failure:  HTTP/1.1 302 Found  Location: https://rp1.example.com/silent-cb?error=login_required&state=sm-state-2200
```

## 4. Redeem the code for fresh tokens + a new session_state

```bash
curl -s -X POST 'https://idp.example.com/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u 's6BhdRkqt3:SYNTHETIC-client-secret' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=SplxlOBeZQQ' \
  --data-urlencode 'redirect_uri=https://rp1.example.com/silent-cb'
# Response includes a fresh id_token and a new session_state (hash.salt).
```

## SDK example (browser JS — the RP iframe polling logic)

```html
<!-- The RP iframe posts "client_id session_state" to the OP iframe on an interval. -->
<script>
  const CLIENT_ID = "s6BhdRkqt3";
  const OP_ORIGIN = "https://idp.example.com";
  let sessionState = "6f7d...synthetic.hash.9a2c...synthetic.salt"; // hash.salt from login
  const opFrame = document.getElementById("op-check-session").contentWindow;

  function poll() {
    // NOTE: this is postMessage, not an HTTP request — you won't see it in Network.
    opFrame.postMessage(CLIENT_ID + " " + sessionState, OP_ORIGIN);
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== OP_ORIGIN) return;          // MUST verify origin
    if (e.data === "unchanged") return;          // keep polling
    if (e.data === "error")     return fallbackToServerDrivenLogout();
    if (e.data === "changed")   silentReauthWithPromptNone(); // then update sessionState
  });

  setInterval(poll, 3000);
</script>
```

> **All values here are synthetic.** The `client_id`, `client_secret`, `session_state`,
> `nonce`, codes, and cookies are sanitized placeholders. Never paste a real client
> secret, session cookie, or `session_state` into these files.
