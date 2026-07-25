---
title: "OAuth 2.0 Token Revocation (RFC 7009) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7009"
---

# OAuth 2.0 Token Revocation (RFC 7009) — Client Snippets

Runnable snippets for revoking a token at the authorization server and observing the
downstream effect. All values are **synthetic**.

Placeholders:

| Placeholder | Meaning | Synthetic sample |
|---|---|---|
| `$AS` | Authorization server base URL | `https://as.example.com` |
| `$API` | Resource server base URL | `https://api.example.com` |
| `$RT` | Refresh token to revoke | `rt.8f3c1d9a-family-01` |
| `$AT` | Access token | `mF_9.B5f-4.1JqM` |
| `$CID` / `$SECRET` | Client credentials | `s6BhdRkqt3` / `cli-s3cr3t-shhh` |

## 1. Revoke a refresh token (`POST /revoke`)

The client authenticates with its own credentials and POSTs the token, form-encoded.
Revoking a refresh token typically cascades to its access tokens / token family.

```bash
curl -i "$AS/revoke" \
  -u "s6BhdRkqt3:cli-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=rt.8f3c1d9a-family-01" \
  --data-urlencode "token_type_hint=refresh_token"
# -> HTTP/1.1 200 OK   (empty body)
```

## 2. Revoke an access token only

```bash
curl -i "$AS/revoke" \
  -u "s6BhdRkqt3:cli-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=mF_9.B5f-4.1JqM" \
  --data-urlencode "token_type_hint=access_token"
# -> HTTP/1.1 200 OK   (AT invalidated, RT untouched)
```

## 3. Unknown / already-invalid token — still `200` (no oracle)

Per RFC 7009 the endpoint returns `200` even for an unknown token, so it cannot be
used to probe validity:

```bash
curl -i "$AS/revoke" \
  -u "s6BhdRkqt3:cli-s3cr3t-shhh" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=totally-bogus-value"
# -> HTTP/1.1 200 OK   (success regardless)
```

## 4. Bad client authentication → `401`

```bash
curl -i "$AS/revoke" \
  -u "s6BhdRkqt3:WRONG-secret" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "token=rt.8f3c1d9a-family-01"
# -> HTTP/1.1 401  {"error":"invalid_client"}
```

## 5. Observe the effect at the API (`GET /resource`)

After revocation, a resource server that validates via introspection sees the token
as inactive immediately:

```bash
curl -i "$API/resource" \
  -H "Authorization: Bearer mF_9.B5f-4.1JqM"
# -> HTTP/1.1 401  WWW-Authenticate: Bearer error="invalid_token"
```

## SDK example (Node.js)

```js
// Node 18+ (global fetch)
const AS = "https://as.example.com";
const CID = "s6BhdRkqt3";
const SECRET = "cli-s3cr3t-shhh";

async function revoke(token, hint = "refresh_token") {
  const basic = Buffer.from(`${CID}:${SECRET}`).toString("base64");
  const res = await fetch(`${AS}/revoke`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token, token_type_hint: hint }),
  });
  // 200 on success AND on unknown token; 401 only means client auth failed.
  if (res.status === 401) throw new Error("client authentication failed");
  return res.status; // 200
}

// "Sign out everywhere": revoke the refresh token, then drop local state.
await revoke("rt.8f3c1d9a-family-01", "refresh_token");
// clearLocalTokens();
```

> **Synthetic-data note:** every token, id, and secret here is fabricated for
> illustration and is not valid at any real authorization server.
