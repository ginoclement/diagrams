---
title: "OAuth 2.0 Token Exchange (RFC 8693) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8693"
---

# OAuth 2.0 Token Exchange (RFC 8693) — Client Snippets

Runnable snippets for exchanging one token for another at the STS (`/token`), plus
using the resulting delegated token downstream. All values are **synthetic**.

Placeholders:

| Placeholder | Meaning | Synthetic sample |
|---|---|---|
| `$AS` | STS / authorization server base URL | `https://as.example.com` |
| `$API` | Downstream resource server (service B) | `https://api.example.com` |
| `$SUBJ` | Subject token (the user's token) | `AT-user.9a1c...` |
| `$CID` / `$SECRET` | Service A's client credentials | `svc-a` / `svc-a-s3cr3t` |

The grant type is the long URN
`urn:ietf:params:oauth:grant-type:token-exchange`; token-type URNs are
`urn:ietf:params:oauth:token-type:access_token`, `...:saml2`, etc.

## 1. Delegation exchange (`POST /token`)

Service A trades the user's token for a token scoped to service B, recording itself
in the `act` chain.

```bash
curl -i "$AS/token" \
  -u "svc-a:svc-a-s3cr3t" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  --data-urlencode "subject_token=AT-user.9a1c7f20" \
  --data-urlencode "subject_token_type=urn:ietf:params:oauth:token-type:access_token" \
  --data-urlencode "audience=https://api.example.com" \
  --data-urlencode "scope=read:orders"
```

Response (synthetic):

```json
{
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6ImFzLTIwMjYtMDcifQ.eyJzdWIiOiIyNDgyODk3NjEwMDEiLCJhY3QiOnsic3ViIjoic3ZjLWEifX0.SIG-synthetic",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "read:orders"
}
```

## 2. Impersonation exchange (no actor, no `act`)

```bash
curl -i "$AS/token" \
  -u "svc-a:svc-a-s3cr3t" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  --data-urlencode "subject_token=AT-user.9a1c7f20" \
  --data-urlencode "subject_token_type=urn:ietf:params:oauth:token-type:access_token" \
  --data-urlencode "audience=https://api.example.com"
# -> issued token has sub=user and NO act claim (actor disappears)
```

## 3. Cross-protocol exchange (SAML assertion in, OAuth out)

```bash
curl -i "$AS/token" \
  -u "svc-a:svc-a-s3cr3t" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  --data-urlencode "subject_token=PHNhbWxwOl...synthetic-base64-SAML" \
  --data-urlencode "subject_token_type=urn:ietf:params:oauth:token-type:saml2" \
  --data-urlencode "requested_token_type=urn:ietf:params:oauth:token-type:access_token"
```

## 4. Policy denial (`may_act` does not permit this actor)

```bash
curl -i "$AS/token" \
  -u "svc-a:svc-a-s3cr3t" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  --data-urlencode "subject_token=AT-user.9a1c7f20" \
  --data-urlencode "subject_token_type=urn:ietf:params:oauth:token-type:access_token" \
  --data-urlencode "actor_token=AT-serviceX.deadbeef" \
  --data-urlencode "actor_token_type=urn:ietf:params:oauth:token-type:access_token"
# -> HTTP/1.1 400  {"error":"invalid_request"}   (subject may_act does not list service X)
```

## 5. Use the delegated token downstream (`GET /orders`)

```bash
curl -i "$API/orders" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCI...synthetic"
```

## SDK example (Node.js)

```js
// Node 18+ (global fetch)
const AS = "https://as.example.com";
const CID = "svc-a";
const SECRET = "svc-a-s3cr3t";
const TE = "urn:ietf:params:oauth:grant-type:token-exchange";
const AT_TYPE = "urn:ietf:params:oauth:token-type:access_token";

async function exchange({ subjectToken, audience, scope }) {
  const basic = Buffer.from(`${CID}:${SECRET}`).toString("base64");
  const res = await fetch(`${AS}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: TE,
      subject_token: subjectToken,
      subject_token_type: AT_TYPE,
      audience,        // NARROW the downstream audience
      scope,           // NARROW the scope — never broaden the subject grant
    }),
  });
  if (!res.ok) throw new Error(`exchange failed: ${res.status}`);
  return res.json(); // { access_token, issued_token_type, scope, ... }
}

const { access_token } = await exchange({
  subjectToken: "AT-user.9a1c7f20",
  audience: "https://api.example.com",
  scope: "read:orders",
});
// call service B with access_token
```

> **Synthetic-data note:** all tokens, ids, secrets, and the JWT strings above are
> fabricated for illustration and are not valid at any real STS. The JWT signature
> segment is a placeholder, not a real signature.
