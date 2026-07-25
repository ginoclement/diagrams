---
title: "Device Authorization Grant (RFC 8628) — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Authorization Grant (RFC 8628) — Reading it in DevTools

This flow spans **two devices**, and they observe different things:

- The **constrained device** (smart TV / CLI) makes its `/device_authorization` and polled
  `/token` calls over a **back channel — not in any browser**. Inspect those with a proxy
  (mitmproxy / Charles) or the device/CLI's own logs, or with the [curl in snippets.md](./snippets.md).
- The **secondary device** (phone/laptop browser) is where the user opens the verification page.
  That part *is* a normal browser flow you can watch in DevTools.

## Setup (on the secondary device's browser)

1. Open DevTools → **Network** tab.
2. Enable **Preserve log** (the approval includes login + consent navigations).
3. Filter: **Doc**, and type `activate` (or whatever the `verification_uri` path is).
4. Open the `verification_uri` shown by the device and complete sign-in + consent.

## The requests, in order

1. **Device authorization request (DEVICE BACK CHANNEL — not browser-visible)**
   - Request: `POST https://idp.example.com/device_authorization`
   - Body: `client_id`, `scope`. Made by the TV/CLI, so it does not appear in any browser.
   - Response (inspect via proxy/logs): `device_code`, `user_code`, `verification_uri`,
     `verification_uri_complete`, `expires_in`, `interval`.
   - `device_code` is high-entropy and stays on the device–IdP channel; `user_code` is the short
     code the human reads.

2. **Verification page (SECONDARY DEVICE — browser-visible)**
   - Request: `GET https://idp.example.com/activate` (or `...?user_code=WDJB-MJHT` from a QR).
   - Filter: `activate`. In **Query String Parameters** you may see `user_code` when the QR/
     `verification_uri_complete` was used; if the user typed it, it arrives in the subsequent
     form **POST** body instead.
   - Login and consent requests follow (IdP-specific); the IdP sets its **session cookie** here.

3. **Consent submit (SECONDARY DEVICE — browser-visible)**
   - Request: `POST https://idp.example.com/activate` with the `user_code` and an approve/deny
     choice in the body. Response is typically a "you can return to your device" page.

4. **Token polling (DEVICE BACK CHANNEL — not browser-visible)**
   - Request: repeated `POST https://idp.example.com/token`
   - Body: `grant_type=urn:ietf:params:oauth:grant-type:device_code`, `device_code`, `client_id`.
   - Responses (via proxy/logs): HTTP `400` `{"error":"authorization_pending"}` until the user
     finishes, possibly `{"error":"slow_down"}`, then `200` with the tokens. The device must
     honor `interval` and back off on `slow_down`.

## Decoding the ID token (via proxy/logs, not the browser)

The successful `/token` response carries an `id_token` JWT. Decode the payload locally:

```sh
echo '<payload-part>' | tr '_-' '/+' | base64 -d 2>/dev/null
```

Read `iss`, `aud` (== the device `client_id`), `exp`, `auth_time`, and profile claims. Do not
paste real tokens into online decoders.

A sanitized capture (device back-channel calls, as if proxied) is in [samples/](./samples/README.md).
