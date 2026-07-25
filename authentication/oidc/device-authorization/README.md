---
title: "Device Authorization Grant (RFC 8628)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Authorization Grant (RFC 8628)

**Status:** ✅ Current

## Purpose

The Device Authorization Grant (often called the "device flow") lets input-constrained
devices — smart TVs, set-top boxes, CLI tools, IoT hardware — obtain OAuth 2.0 / OIDC
tokens without a browser or a usable keyboard on the device itself. The device asks the
authorization server for a `device_code` / `user_code` pair, shows the user a short code
and a `verification_uri` (often as a QR code), and the user completes authentication and
consent on a **secondary device** (phone or laptop). Meanwhile the constrained device
polls the token endpoint until authorization completes.

## When it's used

- Smart TV and streaming-box app sign-in ("go to example.com/activate and enter ABCD-EFGH").
- CLI tools authenticating a developer (`gh auth login`, `az login`, `gcloud auth login` style).
- Devices with no browser, no keyboard, or where typing a password would be painful or unsafe.
- Not appropriate when the client can host a redirect URI — use
  [Authorization Code + PKCE](../authorization-code-pkce/README.md) instead.

## Actors

| Actor | Role |
|---|---|
| `User` | Human who owns the account |
| `Device` | Input-constrained client (smart TV / CLI) — a public OAuth client |
| `Phone` | Secondary device with a full browser used to approve the request |
| `IdP` | Authorization server (device authorization endpoint + token endpoint) |

## Endpoints and parameters

- `POST /device_authorization` — `client_id`, `scope` (e.g. `openid profile`).
  Response: `device_code`, `user_code`, `verification_uri`,
  `verification_uri_complete` (optional, embeds the code — ideal for QR),
  `expires_in`, `interval`.
- `POST /token` — `grant_type=urn:ietf:params:oauth:grant-type:device_code`,
  `device_code`, `client_id`. Polled at `interval` seconds.

## Alternates covered

- **`authorization_pending`** — user has not finished yet; device keeps polling.
- **`slow_down`** — device polled too fast; it must add 5 seconds to its interval.
- **`expired_token`** — `device_code` expired before the user approved; device must
  restart the flow with a fresh code.
- **`access_denied`** — user declined consent on the secondary device.

## Security notes

- The `user_code` is short-lived, low-entropy, and rate-limited server-side; the
  high-entropy `device_code` never leaves the device–IdP back channel.
- **Remote-phishing risk**: an attacker can start the flow and trick a victim into
  entering the attacker's `user_code` ("enter this code to fix your account"). IdPs
  should display client name, requested scopes, and warnings on the verification page.
- Devices are public clients: no client secret; the token response should be scoped
  minimally and refresh tokens should be sender-constrained or rotated where possible.
- Respect `interval` and `slow_down` to avoid making the token endpoint a DoS target.
- `verification_uri_complete` in a QR code improves usability but slightly increases
  phishing surface — the user never types or verifies the code manually.

## Diagrams

- [Sequence diagram](./sequence.md)
- [Swimlane diagram](./swimlane.md)
- [Flowchart (decision logic)](./flowchart.md)

## Hands-on

- [Reading it in DevTools](devtools.md)
- [Client snippets](snippets.md)
- [Sample capture (HAR + decoded artifacts)](samples/README.md)

## Related diagrams

- [Authorization Code](../authorization-code/README.md) — the browser-capable baseline.
- [Authorization Code + PKCE](../authorization-code-pkce/README.md) — preferred when the device can drive a browser redirect.
- [CIBA](../ciba/README.md) — the other decoupled flow; there the IdP pushes to the user's authentication device instead of the user pulling up a verification URI.
- [Client Credentials](../client-credentials/README.md) — machine-to-machine, no user at all.
- [Refresh Token](../refresh-token/README.md) — how the device stays signed in afterwards.
- [Magic Link](../../tokenless/magic-link/README.md) — a similar "finish sign-in elsewhere" pattern outside OAuth.
