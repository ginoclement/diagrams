# CIBA — Client-Initiated Backchannel Authentication

## Purpose

CIBA (OpenID Connect Client-Initiated Backchannel Authentication) is a **decoupled**
flow: the device where authentication is *initiated* (the consumption device — a call
center desktop, POS terminal, ATM, kiosk) is different from the device where the user
*authenticates* (the authentication device — usually the user's phone). The client sends
a backchannel authentication request identifying the user (e.g. `login_hint`), the IdP
pushes an out-of-band challenge to the user's registered authenticator, and the client
receives tokens via poll, ping, or push once the user approves.

Unlike the [Device Authorization Grant](../device-authorization/README.md), the user
never types a code or visits a URL — the IdP reaches out to them.

## When it's used

- Call center: agent triggers authentication; customer approves on their banking app.
- Point of sale / payment authorization (a core Financial-grade API use case).
- Kiosks and ATMs where entering credentials is undesirable.
- Any scenario where the user is identified up front but present on another device.

## Actors

| Actor | Role |
|---|---|
| `User` | Human being authenticated |
| `Client` | Consumption device (call-center app, POS) — typically a confidential client |
| `IdP` | OpenID Provider with a backchannel authentication endpoint |
| `AuthApp` | Authentication device (user's phone with push-capable authenticator) |

## Endpoints and parameters

- `POST /bc-authorize` (backchannel authentication endpoint) — client authentication
  (e.g. `private_key_jwt`), `scope=openid`, exactly one hint (`login_hint`,
  `login_hint_token`, or `id_token_hint`), optional `binding_message`,
  `user_code`, `requested_expiry`, and `client_notification_token` (ping/push modes).
  Response: `auth_req_id`, `expires_in`, `interval`.
- **Poll mode** — client polls `POST /token` with
  `grant_type=urn:openid:params:grant-type:ciba` and `auth_req_id`.
- **Ping mode** — IdP POSTs `{"auth_req_id": ...}` to the client's
  `client_notification_endpoint` (bearer: `client_notification_token`); client then
  calls `/token` once.
- **Push mode** — IdP POSTs the tokens themselves to the notification endpoint
  (not permitted under FAPI-CIBA profiles).

## Alternates covered

- **Poll vs ping vs push** token delivery modes.
- **`authorization_pending` / `slow_down`** while polling.
- **`expired_token`** — `auth_req_id` expired before the user responded.
- **`access_denied`** — user rejected the push challenge.
- **`transaction_failed`** — IdP could not complete (e.g. push undeliverable).

## Security notes

- The client asserts *who* to authenticate — the IdP must verify the hint maps to a
  real user without leaking account existence (`unknown_user_id` handling).
- **MFA-fatigue / push-bombing risk**: an attacker who knows a victim's identifier can
  spam approval prompts. Mitigate with `binding_message` (show a transaction code on
  both devices), `user_code` (a secret the user pre-shares, entered on the auth device),
  rate limiting, and number matching in the authenticator app.
- `binding_message` should be short and human-comparable; it defends against a user
  approving someone else's transaction.
- Ping/push notification endpoints must validate the `client_notification_token` and
  use TLS; push mode delivers bearer tokens to a webhook and is therefore banned in
  FAPI-CIBA — prefer poll or ping.
- CIBA clients are usually confidential and should use strong authentication
  (`private_key_jwt` or mTLS), especially in financial-grade deployments.

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [Device Authorization Grant](../device-authorization/README.md) — decoupled cousin where the user pulls up a verification URI instead of receiving a push.
- [Authorization Code](../authorization-code/README.md) — redirect-based baseline when user and client share a browser.
- [Client Credentials](../client-credentials/README.md) — no user involvement at all.
- [Refresh Token](../refresh-token/README.md) — session continuation after CIBA completes.
- [MFA Enrollment](../../enrollment-and-update/mfa-enrollment/README.md) — how the authentication device gets registered in the first place.
- [Okta FastPass](../../platform-specific/okta-fastpass-passwordless/README.md) — a vendor take on phishing-resistant device-bound authentication.
