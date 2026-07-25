---
title: "WebAuthn / Passkey Authentication Ceremony — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# WebAuthn / Passkey Authentication Ceremony — Sample Capture

A sanitized HAR of the challenge fetch and the assertion POST, with the assertion
fields decoded and annotated. **All values are synthetic** — the signature and
authenticator data are placeholders, not a real cryptographic assertion.

- Capture: [webauthn-passkey-authentication.har](./webauthn-passkey-authentication.har) (HAR 1.2)

## Assertion options (the challenge)

```json
{
  "challenge": "Y2hhbGxlbmdlLVNZTlRIRVRJQy0xMjM0NTY3ODkw",
  "rpId": "app.example.com",
  "allowCredentials": [{ "type": "public-key", "id": "Y3JlZC1TWU5USEVUSUMtaWQtOTk5OA" }],
  "userVerification": "required",
  "timeout": 60000
}
```

| Field | Meaning |
|---|---|
| `challenge` | Random, single-use (base64url); bound to the pending `webauthn_session` cookie server-side |
| `rpId` | Relying Party ID the credential is scoped to — the phishing boundary |
| `allowCredentials` | Credential IDs the server accepts (username-first flow) |
| `userVerification` | `required` → authenticator must verify the user (biometric/PIN) |

## The assertion (`POST .../assertion/verify`), decoded

```json
{
  "id": "Y3JlZC1TWU5USEVUSUMtaWQtOTk5OA",
  "rawId": "Y3JlZC1TWU5USEVUSUMtaWQtOTk5OA",
  "type": "public-key",
  "response": {
    "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0Ii...",
    "authenticatorData": "authDataSYNTHETIC-rpIdHash-flags-counter",
    "signature": "MEUCIQD-SYNTHETIC-signature-bytes",
    "userHandle": "dXNlci1oYW5kbGUtU1lOVEhFVElD"
  }
}
```

### `clientDataJSON` decoded (base64url → JSON)

```bash
echo 'eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWTJoaGJHeGxibWRsTFZOWlRsUklSVlJKUXkweE1qTTBOVFkzT0RrdyIsIm9yaWdpbiI6Imh0dHBzOi8vYXBwLmV4YW1wbGUuY29tIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ' \
  | tr '_-' '/+' | base64 -d
```

yields:

```json
{
  "type": "webauthn.get",
  "challenge": "Y2hhbGxlbmdlLVNZTlRIRVRJQy0xMjM0NTY3ODkw",
  "origin": "https://app.example.com",
  "crossOrigin": false
}
```

| Assertion field | What the server checks |
|---|---|
| `clientDataJSON.type` | Must equal `"webauthn.get"` |
| `clientDataJSON.challenge` | Must equal the issued `challenge` (single-use) |
| `clientDataJSON.origin` | Must be an expected origin (`https://app.example.com`) |
| `authenticatorData` | Contains `rpIdHash` (== SHA-256(rpId)), UP/UV flags, signature counter |
| `signature` | Verified over `authenticatorData \|\| SHA-256(clientDataJSON)` with the stored **public** key |
| `userHandle` | Maps to the account (discoverable-credential/usernameless flows) |

## What is NOT visible

The private key and the signing operation happen **inside the authenticator**
(Touch ID / Windows Hello / security key). The capture shows only the resulting
`signature` bytes — here a placeholder. The credential is created and signed by the
authenticator and never fully exposed to the browser or the network.

## On success

```
Set-Cookie: sid=s%3AsynthSESSIONwebauthn0011; Path=/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax
```

An ordinary [session cookie](../../session-cookie/README.md), same as any login.

---

**Synthetic note:** the challenge, credential ID, authenticatorData, signature, and
userHandle are fabricated placeholders. Only `clientDataJSON` is a genuinely
decodable base64url blob (of synthetic JSON) so the decode example works. No real
keys or credentials appear here.
