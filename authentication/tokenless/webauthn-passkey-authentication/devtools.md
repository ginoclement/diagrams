---
title: "WebAuthn / Passkey Authentication Ceremony — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# WebAuthn / Passkey Authentication Ceremony — DevTools Walkthrough

How to read the WebAuthn assertion ceremony in the browser **Network** tab. All
values are **synthetic**. Enable **Preserve log** and filter to **Fetch/XHR**.

## Observable requests, in order

1. **`POST /webauthn/assertion/options`** — the **challenge fetch**.
   - Request payload may include `{"username":"alice"}` (or nothing for a
     usernameless/discoverable-credential flow).
   - Response JSON is the interesting part — read it under **Response / Preview**:
     - `challenge` — base64url, random (>= 16 bytes), **single-use**, bound to the
       pending login session server-side.
     - `rpId` — e.g. `app.example.com`; the credential is scoped to this RP ID.
     - `allowCredentials[]` — credential IDs the server will accept (username-first
       flows); empty/absent for discoverable-credential flows.
     - `userVerification` — usually `"required"`.

2. **The authenticator gesture** — biometric / PIN. This is **not a network
   request**: `navigator.credentials.get()` hands off to the platform, and the
   private key signs the challenge **inside the authenticator**. You will see a
   pause in the Network tab, then request 3.

3. **`POST /webauthn/assertion/verify`** — the **assertion POST**.
   - Request payload (read under **Payload**) contains the assertion:
     - `id` / `rawId` — which credential was used.
     - `response.clientDataJSON` — base64url; decode it (see below) to see
       `type: "webauthn.get"`, the echoed `challenge`, and `origin`.
     - `response.authenticatorData` — base64url; contains `rpIdHash`, flags
       (UP/UV), and the signature counter.
     - `response.signature` — the signature over
       `authenticatorData || SHA-256(clientDataJSON)`, made by the private key.
     - `response.userHandle` — present for discoverable credentials.
   - **What you cannot see:** the private key and the raw signing operation. The
     credential is created and signed **by the authenticator**; the browser and
     Network tab only expose the resulting `signature` bytes, never the key material.

4. **On success** the response carries **`Set-Cookie: sid=...`** — from here it is an
   ordinary [session cookie](../session-cookie/README.md).

## Decoding `clientDataJSON` in the Console

```js
// paste the base64url value from the verify request payload
const b64url = "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0Iiwi...SYNTHETIC...";
const json = atob(b64url.replace(/-/g, "+").replace(/_/g, "/"));
console.log(JSON.parse(json)); // { type: "webauthn.get", challenge: "...", origin: "https://app.example.com" }
```

Confirm `type === "webauthn.get"`, `challenge` matches the one from step 1, and
`origin` is the real site — the phishing-resistance checks the server also performs.

## What to inspect where

| Signal | Where in DevTools |
|---|---|
| `challenge`, `rpId`, `allowCredentials` | Network → `POST .../assertion/options` → Response → Preview |
| assertion fields (clientDataJSON, authenticatorData, signature) | Network → `POST .../assertion/verify` → Payload |
| decoded clientDataJSON (type/challenge/origin) | Console: `JSON.parse(atob(...))` |
| session on success | Network → verify row → Response Headers → `Set-Cookie` |

See [samples/README.md](./samples/README.md) for a captured HAR with the assertion
fields decoded and annotated.
