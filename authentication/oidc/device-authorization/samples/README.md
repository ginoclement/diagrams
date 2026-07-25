---
title: "Device Authorization Grant (RFC 8628) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Authorization Grant (RFC 8628) — Sample Capture

A sanitized capture for the [Device Authorization grant](../README.md).

- Capture file: [`./device-authorization.har`](./device-authorization.har)

The HAR has three entries, all **device back-channel** calls (not browser-visible; captured as if
through a proxy): the `/device_authorization` request, one polling `/token` that returns
`authorization_pending` (HTTP 400), and the final `/token` that returns tokens once the user
approved on their phone.

## Device authorization response (key fields)

```jsonc
{
  "device_code": "dc_synthetic_GmRhmhcxhwAZ",   // high-entropy; stays on the device<->IdP channel
  "user_code": "WDJB-MJHT",                      // short code the human types on the phone
  "verification_uri": "https://idp.example.com/activate",
  "verification_uri_complete": "https://idp.example.com/activate?user_code=WDJB-MJHT", // for QR
  "expires_in": 900,                             // seconds before device_code expires
  "interval": 5                                  // minimum seconds between token polls
}
```

## Decoded ID token (from the successful poll)

The final `/token` response carries an `id_token` JWT (`header.payload.signature`).

### Header (annotated)

```jsonc
{
  "alg": "RS256",             // signature algorithm; verify via the IdP JWKS
  "typ": "JWT",               // token type
  "kid": "idp-2026-07-key1"   // key id selecting the JWKS public key
}
```

### Payload / claims (annotated)

```jsonc
{
  "iss": "https://idp.example.com",   // issuer — the authorization server
  "sub": "248289761001",              // stable opaque user id (the account approved on the phone)
  "aud": "tv-device-app-01",          // audience — MUST equal the device client_id
  "exp": 1774000000,                  // expiry (Unix seconds)
  "iat": 1773996400,                  // issued-at
  "auth_time": 1773996380,            // when the user authenticated on the secondary device
  "name": "Ada Lovelace",             // profile claim (synthetic)
  "email": "ada.lovelace@example.com",// profile claim (synthetic)
  "email_verified": true              // address verified by the IdP
}
```

There is no `nonce` here — the device flow has no front-channel `/authorize` request to carry
one; binding is instead via the `device_code` on the back channel.

---

**Everything here is synthetic.** Device code, user code, tokens, and signature are all fake.
