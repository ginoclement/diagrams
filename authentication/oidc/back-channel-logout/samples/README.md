---
title: "Back-Channel Logout — Sample Capture & Decoded Logout Token"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Back-Channel Logout — Sample Capture & Decoded Logout Token

Sanitized artifacts for OIDC Back-Channel Logout 1.0. All values are **synthetic**.

- HAR capture: [./back-channel-logout.har](./back-channel-logout.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

The HAR includes the server-to-server `POST /backchannel-logout` entry (which is **not**
observable in a browser Network tab) so you can practice decoding the `logout_token`.

## The `logout_token` (as delivered in the POST body)

```
eyJhbGciOiJSUzI1NiIsInR5cCI6ImxvZ291dCtqd3QiLCJraWQiOiJpZHAta2V5LTIwMjYifQ.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsImF1ZCI6InM2QmhkUmtxdDMiLCJpYXQiOjE3NzQwMDAwMDAsImp0aSI6ImJXSnEtbG9nb3V0LTAwMDEiLCJleHAiOjE3NzQwMDAxMjAsImV2ZW50cyI6eyJodHRwOi8vc2NoZW1hcy5vcGVuaWQubmV0L2V2ZW50L2JhY2tjaGFubmVsLWxvZ291dCI6e319LCJzdWIiOiIyNDgyODk3NjEwMDEiLCJzaWQiOiJhYmMxMjNzZXNzaW9uIn0.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded header

```json
{
  "alg": "RS256",              // signature algorithm — MUST NOT be "none"
  "typ": "logout+jwt",         // distinguishes a logout token from an ID token
  "kid": "idp-key-2026"        // key id — pick the matching JWK from the IdP jwks_uri
}
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",   // issuer — MUST equal the expected OP
  "aud": "s6BhdRkqt3",                // audience — MUST contain this RP's client_id
  "iat": 1774000000,                  // issued-at — MUST be recent
  "jti": "bWJq-logout-0001",          // unique id — cache to reject replays
  "exp": 1774000120,                  // expiry — short-lived (here 120s after iat)
  "events": {                          // REQUIRED — marks this as a back-channel logout
    "http://schemas.openid.net/event/backchannel-logout": {}
  },
  "sub": "248289761001",              // subject — which user
  "sid": "abc123session"              // session id — which specific session to kill
}
```

### Validation checklist (what the RP enforces)

1. Signature verifies against the IdP JWK with `kid=idp-key-2026`; `alg` is allowed (not `none`).
2. `iss` matches the expected issuer; `aud` contains this RP's `client_id`.
3. `iat` is recent and `exp` has not passed.
4. `events` contains `http://schemas.openid.net/event/backchannel-logout`.
5. `sub` and/or `sid` present (if `backchannel_logout_session_required`, `sid` is mandatory).
6. **No `nonce` claim** — its presence means an ID token was replayed as a logout token → reject `400`.
7. `jti` not seen before (replay cache within the validity window).
8. Locate session(s) by `sid` (one session) or `sub` (all of the user's sessions) and destroy them; revoke refresh tokens.

> Every field above is a sanitized placeholder. The signature segment is literally
> `SIG_synthetic_not_a_real_signature_do_not_verify` and will not verify against any key.
