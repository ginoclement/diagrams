---
title: "OAuth 2.0 Token Exchange (RFC 8693) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8693"
---

# OAuth 2.0 Token Exchange (RFC 8693) — DevTools Walkthrough

How to observe a token exchange. The key caveat:

> **The exchange is a back-channel, service-to-service call.** `POST /token` with
> the token-exchange grant is made by a **service (client) to the STS**, using client
> authentication. It happens between servers in a call chain and **does not appear in
> the browser's Network tab.** Watch it in the calling service's egress logs or the
> STS access logs, or reproduce it with the `curl` in [snippets.md](./snippets.md).

Observable requests, in order:

## 1. `POST /token` — service A to STS (back-channel, NOT in browser)

- **Where:** service-A egress logs / STS access logs.
- **Filter:** filter for the `/token` path with a body containing
  `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`.
- **Request params to read (URL-decode the form body):**
  - `grant_type` — the token-exchange URN.
  - `subject_token` + `subject_token_type` — the party the new token represents.
  - `actor_token` + `actor_token_type` — present when an explicit acting party is
    supplied (delegation).
  - `audience` / `resource` — the downstream target; **should narrow**, never widen.
  - `scope` — requested downstream scope; **should narrow**.
  - `requested_token_type` — what the caller wants back (e.g. access_token).
  - `Authorization: Basic ...` — service A's client authentication (decode to
    confirm the caller).
- **Response fields to read:**
  - `issued_token_type` — the type actually returned (may differ from requested).
  - `access_token` — the exchanged token. If it is a JWT (`at+jwt`), split on `.`
    and base64url-decode header + payload; look for:
    - `sub` — the subject (unchanged in both delegation and impersonation).
    - `act` — **present in delegation** (`{"sub":"svc-a"}`, nesting for chains),
      **absent in impersonation**. This is the single most important field to read.
    - `aud` / `scope` — confirm they were narrowed to the downstream service.
  - `expires_in`, `scope`.
- **Denial:** `400 invalid_request` when the subject token's `may_act` does not
  authorize this actor.

## 2. `GET /orders` — delegated token to service B (may be back-channel too)

- **Where:** service-B inbound logs (this hop is also typically service-to-service).
- **What to read:** `Authorization: Bearer <exchanged token>`. Decode it and confirm
  service B sees `sub=user` and `act.sub=service-A`, and enforces the narrowed scope.

## Decoding the `act` chain

Chained exchanges nest `act`:

```jsonc
"act": { "sub": "svc-b", "act": { "sub": "svc-a" } }  // B acting-for A acting-for user
```

Read outermost-first: the outer `act.sub` is the most recent actor. Impersonation
tokens have **no** `act` at all — which is exactly why delegation is preferred for
auditability.

See [samples/token-exchange.har](./samples/token-exchange.har) and the decoded
request/response in [samples/README.md](./samples/README.md).
