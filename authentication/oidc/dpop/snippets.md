---
title: "DPoP — Demonstrating Proof of Possession (RFC 9449) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9449"
---

# DPoP — Demonstrating Proof of Possession (RFC 9449) — Client Snippets

Runnable snippets for DPoP: build a proof, get a `jkt`-bound token at `/token`, then
call the API with a fresh proof carrying `ath`. All values are **synthetic** — the
signatures are placeholders, not real ECDSA signatures.

Placeholders:

| Placeholder | Meaning | Synthetic sample |
|---|---|---|
| `$AS` | Authorization server base URL | `https://as.example.com` |
| `$API` | Resource server base URL | `https://api.example.com` |
| `$AT` | DPoP-bound access token | `mF_9.B5f-4.1JqM` |

## The DPoP proof JWT

A proof is a JWT signed by the client's private key. Its **header** carries the
public key (`jwk`) and `typ: dpop+jwt`; its **payload** carries `htm`, `htu`, `iat`,
`jti`, plus `ath` when calling a resource.

Proof for the token endpoint — decoded:

```jsonc
// header
{
  "typ": "dpop+jwt",
  "alg": "ES256",
  "jwk": {                      // the PUBLIC key; AS derives jkt = SHA-256 thumbprint
    "kty": "EC",
    "crv": "P-256",
    "x": "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
    "y": "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA"
  }
}
// payload
{
  "jti": "proof-e1b2c3d4",                 // unique per proof (replay defense)
  "htm": "POST",                           // HTTP method of the target request
  "htu": "https://as.example.com/token",   // target URI (no query/fragment)
  "iat": 1774000000                        // issued-at; AS enforces a tight window
}
```

Compact form (this is what goes in the `DPoP` header):

```
eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoibDh0RnJoeC0zNHRWM2hSSUNSRFk5ekNrRGxwQmhGNDJVUVVmV1ZBV0JGcyIsInkiOiI5VkU0amZfT2tfbzY0emJUVGxjdU5KYWpIbXQ2djlURFZyVTBDZHZHUkRBIn19.eyJqdGkiOiJwcm9vZi1lMWIyYzNkNCIsImh0bSI6IlBPU1QiLCJodHUiOiJodHRwczovL2FzLmV4YW1wbGUuY29tL3Rva2VuIiwiaWF0IjoxNzc0MDAwMDAwfQ.MEUCIQD-synthetic-ecdsa-signature-not-real-AAAA
```

## 1. Token request with a DPoP proof (`POST /token`)

The proof travels in the **`DPoP` request header**. The AS returns
`token_type: DPoP` and binds the access token via `cnf.jkt`.

```bash
curl -i "$AS/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoibDh0RnJoeC0zNHRWM2hSSUNSRFk5ekNrRGxwQmhGNDJVUVVmV1ZBV0JGcyIsInkiOiI5VkU0amZfT2tfbzY0emJUVGxjdU5KYWpIbXQ2djlURFZyVTBDZHZHUkRBIn19.eyJqdGkiOiJwcm9vZi1lMWIyYzNkNCIsImh0bSI6IlBPU1QiLCJodHUiOiJodHRwczovL2FzLmV4YW1wbGUuY29tL3Rva2VuIiwiaWF0IjoxNzc0MDAwMDAwfQ.MEUCIQD-synthetic-ecdsa-signature-not-real-AAAA" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=SplxlOBeZQQYbYS6WxSbIA" \
  --data-urlencode "redirect_uri=https://app.example.com/cb" \
  --data-urlencode "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

Response (synthetic):

```json
{
  "access_token": "mF_9.B5f-4.1JqM",
  "token_type": "DPoP",
  "expires_in": 3600,
  "scope": "read:orders"
}
```

The bound token's `cnf` (visible via [introspection](../token-introspection/README.md)
or, for a JWT AT, in the payload):

```json
{ "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" } }
```

## 2. Resource request with a DPoP proof + `ath` (`GET /resource`)

A **fresh** proof (new `jti`, `htm=GET`, `htu` of the API, and `ath` = base64url
SHA-256 of the access token). The token is presented with the **`DPoP` auth
scheme**, not `Bearer`.

```bash
curl -i "$API/resource" \
  -H "Authorization: DPoP mF_9.B5f-4.1JqM" \
  -H "DPoP: eyJ0eXAiOiJkcG9wK2p3dCIsImFsZyI6IkVTMjU2IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2IjoiUC0yNTYiLCJ4IjoibDh0RnJoeC0zNHRWM2hSSUNSRFk5ekNrRGxwQmhGNDJVUVVmV1ZBV0JGcyIsInkiOiI5VkU0amZfT2tfbzY0emJUVGxjdU5KYWpIbXQ2djlURFZyVTBDZHZHUkRBIn19.eyJqdGkiOiJwcm9vZi1hOWY4ZTdkNiIsImh0bSI6IkdFVCIsImh0dSI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tL3Jlc291cmNlIiwiaWF0IjoxNzc0MDAwMTAwLCJhdGgiOiJmVUh5TzJyMlozRFo1M0VzTnJXQmIweFdYb2FOeTU5SWlLQ0Fxa3NtUUVvIn0.MEUCIQD-synthetic-ecdsa-signature-not-real-AAAA"
```

## 3. Server nonce challenge (`use_dpop_nonce`)

If the AS requires a nonce, the first attempt is rejected and returns one:

```bash
curl -i "$AS/token" -H "DPoP: <proof-without-nonce>" ...
# -> HTTP/1.1 400
#    DPoP-Nonce: eyJ7S_zG.ewauwAF.n-0S6
#    {"error":"use_dpop_nonce"}
```

The client rebuilds the proof adding the `nonce` claim and retries. The same
`WWW-Authenticate: DPoP ..., error="use_dpop_nonce"` + `DPoP-Nonce` mechanism applies
at the resource server.

## SDK example (browser, WebCrypto — non-extractable key)

```js
// Generate a non-extractable P-256 key; the private key never leaves the browser.
const kp = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  false,                       // extractable = false (key stays in the client)
  ["sign"]
);
const pubJwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function dpopProof({ htm, htu, accessToken, nonce }) {
  const header = { typ: "dpop+jwt", alg: "ES256",
    jwk: { kty: "EC", crv: "P-256", x: pubJwk.x, y: pubJwk.y } };
  const payload = {
    jti: crypto.randomUUID(),
    htm, htu,
    iat: Math.floor(Date.now() / 1000),
    ...(nonce ? { nonce } : {}),
    ...(accessToken
      ? { ath: b64u(await crypto.subtle.digest("SHA-256",
          new TextEncoder().encode(accessToken))) }
      : {}),
  };
  const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, kp.privateKey,
    new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64u(sig)}`;
}

// token request
const tokenProof = await dpopProof({ htm: "POST", htu: "https://as.example.com/token" });
// resource request (adds ath over the access token)
const apiProof = await dpopProof({
  htm: "GET", htu: "https://api.example.com/resource", accessToken: "mF_9.B5f-4.1JqM",
});
// fetch("https://api.example.com/resource",
//   { headers: { Authorization: `DPoP mF_9.B5f-4.1JqM`, DPoP: apiProof } });
```

> **Synthetic-data note:** the keys, proofs, thumbprints, tokens, codes, and nonces
> here are fabricated for illustration. The proof JWTs' header and payload are genuine
> base64url, but the signature segment is a placeholder — the proofs will not verify.
