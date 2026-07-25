---
title: "OIDC Session Management — Sample Capture & Decoded Re-auth Token"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OIDC Session Management — Sample Capture & Decoded Re-auth Token

Sanitized artifacts for OIDC Session Management 1.0. All values are **synthetic**.

- HAR capture: [./session-management.har](./session-management.har)
- Flow docs: [../README.md](../README.md) · [../devtools.md](../devtools.md) · [../snippets.md](../snippets.md)

The HAR contains only the network-observable steps. **The `postMessage` poll loop is not
HTTP and is not in the capture** — see [../devtools.md](../devtools.md) for how to watch it
in the Console.

## The `session_state` value (not a JWT)

```
6f7dsynthetichash.9a2csyntheticsalt
```

- Format is `hash.salt`. The `hash` is computed over `client_id`, request origin, the OP's
  browser-state (an opaque per-user-agent cookie), and the `salt`.
- The `salt` rotates on every computation, so the value changes even when the session is
  unchanged; it is **not** the OP session cookie and is not linkable across RPs.

## The `id_token` from the silent `prompt=none` re-authentication

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImlkcC1rZXktMjAyNiJ9.eyJpc3MiOiJodHRwczovL2lkcC5leGFtcGxlLmNvbSIsInN1YiI6IjI0ODI4OTc2MTAwMSIsImF1ZCI6InM2QmhkUmtxdDMiLCJleHAiOjE3NzQwMDcyMDAsImlhdCI6MTc3NDAwMzYwMCwiYXV0aF90aW1lIjoxNzczOTk5OTAwLCJub25jZSI6InNtLXJlYXV0aC05OTMxIiwic2lkIjoiYWJjMTIzc2Vzc2lvbiIsImF6cCI6InM2QmhkUmtxdDMifQ.SIG_synthetic_not_a_real_signature_do_not_verify
```

### Decoded header

```json
{ "alg": "RS256", "typ": "JWT", "kid": "idp-key-2026" }
```

### Decoded payload (annotated)

```json
{
  "iss": "https://idp.example.com",   // issuer — validate even on silent re-auth
  "sub": "248289761001",              // subject
  "aud": "s6BhdRkqt3",                // this RP's client_id
  "exp": 1774007200,                  // fresh expiry from the re-auth
  "iat": 1774003600,
  "auth_time": 1773999900,            // ORIGINAL login time — unchanged; the OP session persisted
  "nonce": "sm-reauth-9931",          // MUST match the nonce sent on the prompt=none request
  "sid": "abc123session",             // same session id — confirms it's the same OP session
  "azp": "s6BhdRkqt3"                 // authorized party
}
```

> **Why validate fully even here:** a `"changed"` postMessage is only a *trigger*. The
> silent re-auth still requires full ID-token validation (signature, `iss`, `aud`,
> `nonce`) — the signal is not a trust anchor. Note `auth_time` did not advance: the user
> was still logged in at the OP, so no fresh credential prompt occurred.

## Reading the HAR

- Entry 1 — `GET /check_session`: the OP iframe load (hidden frame).
- Entry 2 — `GET /authorize?...&prompt=none`: silent re-auth, `302` with a `code` →
  success (a failure would be `error=login_required`).
- Entry 3 — `POST /token`: fresh `id_token` (decoded above) **and** a new `session_state`.

> Every value is a sanitized placeholder; the signature segment
> (`SIG_synthetic_not_a_real_signature_do_not_verify`) will not verify.
