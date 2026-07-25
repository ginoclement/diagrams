---
title: "CIBA — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# CIBA — Client Snippets

Runnable snippets for OIDC Client-Initiated Backchannel Authentication (CIBA). CIBA is a
**decoupled, server-to-server** flow: the consumption-device client calls the IdP directly
and the user approves out-of-band on their phone. None of this is a browser flow — run
these from the client back end. See [README](./README.md).

## 1. Backchannel authentication request (poll mode)

```bash
# Confidential client authenticates (private_key_jwt shown as a placeholder assertion).
# Exactly ONE hint: login_hint OR login_hint_token OR id_token_hint.
curl -s -X POST 'https://idp.example.com/bc-authorize' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'scope=openid' \
  --data-urlencode 'login_hint=+15550001234' \
  --data-urlencode 'binding_message=PAY-4711' \
  --data-urlencode 'requested_expiry=120' \
  --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
  --data-urlencode 'client_assertion=eyJ...SYNTHETIC-private-key-jwt...'
# Response: {"auth_req_id":"1c266114-a1be-4252-8ad1-04986c5b9ac1","expires_in":120,"interval":5}
```

## 2. Poll the token endpoint

```bash
# Repeat every `interval` seconds until success or terminal error.
curl -s -X POST 'https://idp.example.com/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=urn:openid:params:grant-type:ciba' \
  --data-urlencode 'auth_req_id=1c266114-a1be-4252-8ad1-04986c5b9ac1' \
  --data-urlencode 'client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' \
  --data-urlencode 'client_assertion=eyJ...SYNTHETIC-private-key-jwt...'
# While pending:  400 {"error":"authorization_pending"}
# Too fast:       400 {"error":"slow_down"}
# Expired:        400 {"error":"expired_token"}
# User rejected:  400 {"error":"access_denied"}
# Approved:       200 {"access_token":"...","id_token":"...","refresh_token":"..."}
```

## 3. Ping mode — the IdP notifies the client's endpoint

```bash
# In ping mode the /bc-authorize request also carried a client_notification_token.
# The IdP POSTs to the client's notification endpoint when the user approves:
#   POST https://client.example.com/ciba-cb
#   Authorization: Bearer SYNTHETIC-client-notification-token
#   {"auth_req_id":"1c266114-a1be-4252-8ad1-04986c5b9ac1"}
# The client then calls /token ONCE (as in step 2) to collect the tokens.
```

> **Push mode** delivers the tokens themselves to the notification endpoint and is
> **banned under FAPI-CIBA** — prefer poll or ping.

## SDK example (Node.js — backchannel request then poll)

```js
// npm i undici
import { request } from "undici";

const IDP = "https://idp.example.com";
const clientAssertion = "eyJ...SYNTHETIC-private-key-jwt..."; // signed per-request in prod

async function form(url, body) {
  const res = await request(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  return { status: res.statusCode, json: await res.body.json() };
}

// 1) initiate
const init = await form(`${IDP}/bc-authorize`, {
  scope: "openid",
  login_hint: "+15550001234",
  binding_message: "PAY-4711",
  client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  client_assertion: clientAssertion,
});
const { auth_req_id, interval } = init.json;

// 2) poll, honoring slow_down
let wait = (interval || 5) * 1000;
for (;;) {
  await new Promise((r) => setTimeout(r, wait));
  const p = await form(`${IDP}/token`, {
    grant_type: "urn:openid:params:grant-type:ciba",
    auth_req_id,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion,
  });
  if (p.status === 200) { console.log("tokens", p.json); break; }
  if (p.json.error === "authorization_pending") continue;
  if (p.json.error === "slow_down") { wait += 5000; continue; }
  throw new Error(p.json.error); // expired_token / access_denied / transaction_failed
}
```

> **All values here are synthetic.** The `auth_req_id`, `login_hint` phone number,
> `binding_message`, `client_assertion`, and notification token are sanitized
> placeholders. Never paste a real private-key JWT, phone number, or `auth_req_id` here.
