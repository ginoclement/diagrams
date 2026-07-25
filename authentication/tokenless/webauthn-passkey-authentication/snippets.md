---
title: "WebAuthn / Passkey Authentication Ceremony — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# WebAuthn / Passkey Authentication Ceremony — Client Snippets

Client snippets for the WebAuthn assertion (login) ceremony. All hosts, challenges,
credential IDs, and signatures are **synthetic** placeholders. WebAuthn is a
[W3C specification](https://www.w3.org/TR/webauthn-2/), not an IETF RFC.

## 1. Fetch a challenge (assertion options)

```bash
curl -i -c cookies.txt -X POST https://app.example.com/webauthn/assertion/options \
  -H "Content-Type: application/json" \
  -d '{"username":"alice"}'
# -> 200 OK
# {
#   "challenge": "Y2hhbGxlbmdlLVNZTlRIRVRJQy0xMjM0NTY3ODkw",   // base64url, single-use
#   "rpId": "app.example.com",
#   "allowCredentials": [
#     { "type": "public-key", "id": "Y3JlZC1TWU5USEVUSUMtaWQtOTk5OA" }
#   ],
#   "userVerification": "required",
#   "timeout": 60000
# }
# The server binds this challenge to the pending login session (the cookie in -c).
```

## 2. Browser ceremony — `navigator.credentials.get()` (JavaScript)

```js
// Runs in the page. The authenticator (Touch ID / Windows Hello / security key)
// performs user verification and signs the challenge; the private key never leaves it.
function b64urlToBuf(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s.padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const options = await (await fetch("/webauthn/assertion/options", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "alice" }),
})).json();

const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: b64urlToBuf(options.challenge),
    rpId: options.rpId,
    allowCredentials: options.allowCredentials.map((c) => ({
      type: "public-key",
      id: b64urlToBuf(c.id),
    })),
    userVerification: options.userVerification, // "required"
    timeout: options.timeout,
  },
});

// assertion.response contains clientDataJSON, authenticatorData, signature, userHandle.
```

## 3. Send the assertion back to the server for verification

```js
const enc = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const body = {
  id: assertion.id,
  rawId: enc(assertion.rawId),
  type: assertion.type,
  response: {
    clientDataJSON: enc(assertion.response.clientDataJSON),
    authenticatorData: enc(assertion.response.authenticatorData),
    signature: enc(assertion.response.signature),
    userHandle: assertion.response.userHandle ? enc(assertion.response.userHandle) : null,
  },
};

const verify = await fetch("/webauthn/assertion/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
// -> 200 OK + Set-Cookie: sid=...  (ordinary session on success)
```

## The equivalent verify POST as curl (synthetic payload)

```bash
curl -i -b cookies.txt -c cookies.txt -X POST https://app.example.com/webauthn/assertion/verify \
  -H "Content-Type: application/json" \
  -d '{
    "id": "Y3JlZC1TWU5USEVUSUMtaWQtOTk5OA",
    "rawId": "Y3JlZC1TWU5USEVUSUMtaWQtOTk5OA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0Iiwi...SYNTHETIC...",
      "authenticatorData": "authDataSYNTHETICb64url",
      "signature": "MEUCIQD-SYNTHETIC-signature-bytes",
      "userHandle": "dXNlci1oYW5kbGUtU1lOVEhFVElD"
    }
  }'
# -> 200 OK, Set-Cookie: sid=s%3AsynthSESSIONwebauthn0011; HttpOnly; Secure; SameSite=Lax
```

---

**Synthetic note:** the challenge, credential ID, clientDataJSON, authenticatorData,
signature, and userHandle are fabricated placeholders. A real assertion's signature is
produced by the authenticator over `authenticatorData || SHA-256(clientDataJSON)` and
cannot be reconstructed from this document. No real keys or credentials appear here.
