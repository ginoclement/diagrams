---
title: "OAuth 2.0 Token Introspection (RFC 7662) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7662"
---

# OAuth 2.0 Token Introspection (RFC 7662) — Client Snippets

Runnable client snippets for the introspection flow: the resource-server call that
carries the bearer token, and the back-channel `POST /introspect` the resource
server makes to the authorization server. Every value below is **synthetic** — swap
in your own endpoints, client credentials, and tokens.

Placeholders used throughout:

| Placeholder | Meaning | Synthetic sample |
|---|---|---|
| `$AS` | Authorization server base URL | `https://as.example.com` |
| `$API` | Resource server base URL | `https://api.example.com` |
| `$AT` | Opaque access token being introspected | `mF_9.B5f-4.1JqM` |
| `$RS_ID` | Resource server's own client id at the AS | `rs-orders` |
| `$RS_SECRET` | Resource server's client secret | `rs-s3cr3t-shhh` |

## 1. Client calls the resource (`GET /resource`)

The client presents the opaque access token as a normal bearer token. This is the
only request the original client makes.

```bash
curl -i "$API/resource" \
  -H "Authorization: Bearer mF_9.B5f-4.1JqM"
```

## 2. Resource server introspects the token (`POST /introspect`)

The resource server authenticates with its **own** client credentials (HTTP Basic
here) and POSTs the token as `application/x-www-form-urlencoded`. This is a
back-channel call — it does not originate in the browser.

```bash
curl -i "$AS/introspect" \
  -u "rs-orders:rs-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=mF_9.B5f-4.1JqM" \
  --data-urlencode "token_type_hint=access_token"
```

Active-token response (synthetic):

```json
{
  "active": true,
  "scope": "read:orders",
  "client_id": "s6BhdRkqt3",
  "username": "avery.diaz",
  "token_type": "Bearer",
  "sub": "248289761001",
  "aud": "https://api.example.com",
  "iss": "https://as.example.com",
  "exp": 1774000000,
  "iat": 1773996400,
  "jti": "atk-7c1f9a2b",
  "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" }
}
```

Inactive token — the response is exactly this, with no leaked claims:

```json
{ "active": false }
```

## 3. Unauthorized caller

If the resource server presents bad or missing client authentication the endpoint
returns `401 invalid_client` — the API must fail closed, never fail open:

```bash
curl -i "$AS/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=mF_9.B5f-4.1JqM"
# -> HTTP/1.1 401  {"error":"invalid_client"}
```

## SDK example (Node.js)

Minimal resource-server middleware that introspects an opaque token and enforces
audience + scope. Synthetic values only.

```js
// npm i undici  (or use global fetch on Node 18+)
const AS = "https://as.example.com";
const RS_ID = "rs-orders";
const RS_SECRET = "rs-s3cr3t-shhh";

async function introspect(accessToken) {
  const basic = Buffer.from(`${RS_ID}:${RS_SECRET}`).toString("base64");
  const res = await fetch(`${AS}/introspect`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: accessToken,
      token_type_hint: "access_token",
    }),
  });
  if (res.status === 401) throw new Error("introspection auth failed"); // fail closed
  return res.json();
}

export async function requireScope(req, res, next, needed = "read:orders") {
  const at = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const meta = await introspect(at);
  const scopes = (meta.scope || "").split(" ");
  if (
    !meta.active ||
    meta.aud !== "https://api.example.com" ||
    !scopes.includes(needed)
  ) {
    res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token"');
    return res.status(401).end();
  }
  req.token = meta; // { active, sub, scope, cnf, ... }
  next();
}
```

> **Synthetic-data note:** all tokens, client ids, secrets, subjects, thumbprints,
> and timestamps here are fabricated for illustration. They are not valid at any real
> authorization server and must never be reused as-is.
