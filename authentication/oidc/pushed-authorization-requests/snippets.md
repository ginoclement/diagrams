---
title: "Pushed Authorization Requests (PAR, RFC 9126) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9126"
---

# Pushed Authorization Requests (PAR, RFC 9126) — Client Snippets

Runnable snippets for the PAR flow: push the request, get a `request_uri`, redirect
the browser with it, then redeem the code. All values are **synthetic**.

Placeholders:

| Placeholder | Meaning | Synthetic sample |
|---|---|---|
| `$AS` | Authorization server base URL | `https://as.example.com` |
| `$CID` / `$SECRET` | Client credentials | `s6BhdRkqt3` / `cli-s3cr3t-shhh` |
| `$REDIRECT` | Client redirect URI | `https://app.example.com/cb` |
| `$VERIFIER` | PKCE code_verifier (kept by client) | `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` |
| `$CHALLENGE` | PKCE S256 challenge | `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM` |

## 1. Push the request (`POST /par`)

The client POSTs **all** authorization parameters over the back channel with client
authentication. Nothing here travels through the browser.

```bash
curl -i "$AS/par" \
  -u "s6BhdRkqt3:cli-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "response_type=code" \
  --data-urlencode "client_id=s6BhdRkqt3" \
  --data-urlencode "redirect_uri=https://app.example.com/cb" \
  --data-urlencode "scope=openid read:orders" \
  --data-urlencode "code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM" \
  --data-urlencode "code_challenge_method=S256" \
  --data-urlencode "state=af0ifjsldkj" \
  --data-urlencode "nonce=n-0S6_WzA2Mj"
```

Response (synthetic) — the returned **`request_uri`** is the whole point:

```json
{
  "request_uri": "urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c",
  "expires_in": 60
}
```

Note the `201 Created` status and `Cache-Control: no-store`.

## 2. Redirect the browser with the `request_uri` (`GET /authorize`)

Only `client_id` and `request_uri` are sent on the front channel — a short,
integrity-protected reference. The AS ignores any other query parameters.

```bash
# This is the URL the client 302-redirects the browser to:
echo "$AS/authorize?client_id=s6BhdRkqt3&request_uri=urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c"
```

## 3. Redeem the code (`POST /token`)

After login/consent the AS redirects back to `redirect_uri?code=...&state=...`; the
client exchanges the code, sending the PKCE `code_verifier`.

```bash
curl -i "$AS/token" \
  -u "s6BhdRkqt3:cli-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=SplxlOBeZQQYbYS6WxSbIA" \
  --data-urlencode "redirect_uri=https://app.example.com/cb" \
  --data-urlencode "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

## 4. Expired / reused `request_uri`

```bash
echo "$AS/authorize?client_id=s6BhdRkqt3&request_uri=urn:ietf:params:oauth:request_uri:STALE"
# -> AS responds with error=invalid_request_uri (single-use, ~60s TTL)
```

## Signed request object (JAR) pushed via PAR

The pushed body can itself be a signed JWT request object:

```bash
curl -i "$AS/par" \
  -u "s6BhdRkqt3:cli-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "client_id=s6BhdRkqt3" \
  --data-urlencode "request=eyJhbGciOiJSUzI1NiJ9.eyJyZXNwb25zZV90eXBlIjoiY29kZSJ9.SIG-synthetic"
```

## SDK example (Node.js)

```js
// Node 18+ (global fetch)
const AS = "https://as.example.com";
const CID = "s6BhdRkqt3";
const SECRET = "cli-s3cr3t-shhh";

async function pushAuthzRequest(params) {
  const basic = Buffer.from(`${CID}:${SECRET}`).toString("base64");
  const res = await fetch(`${AS}/par`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  if (res.status === 401) throw new Error("client authentication failed"); // invalid_client
  const { request_uri, expires_in } = await res.json();
  return { request_uri, expires_in };
}

const { request_uri } = await pushAuthzRequest({
  response_type: "code",
  client_id: CID,
  redirect_uri: "https://app.example.com/cb",
  scope: "openid read:orders",
  code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  code_challenge_method: "S256",
  state: "af0ifjsldkj",
  nonce: "n-0S6_WzA2Mj",
});

const authorizeUrl =
  `${AS}/authorize?client_id=${CID}` +
  `&request_uri=${encodeURIComponent(request_uri)}`;
// redirect the browser to authorizeUrl (before expires_in elapses)
```

> **Synthetic-data note:** all client ids, secrets, codes, verifiers, challenges, and
> the `request_uri` value here are fabricated for illustration and are not valid at
> any real authorization server.
