---
title: "Dynamic Client Registration — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7591, RFC 7592"
---

# Dynamic Client Registration — DevTools Walkthrough

How to read a dynamic-registration exchange in a Network capture. DCR is a plain
back-channel JSON API, so every request and response is directly readable — the
interesting part is the **registration request** (what metadata you asked for) and
the **registration response** (what credentials and management handles the AS
issued).

All values referenced below are **synthetic** (see [samples/](./samples/README.md)).

## Observable requests, in order

1. **`POST https://as.example.com/register`** — the registration request.
   - Content-Type `application/json`. Body is the `client_metadata` document —
     inspect `redirect_uris`, `grant_types`, `response_types`,
     `token_endpoint_auth_method`, `scope`.
   - For **protected** registration, note the `Authorization: Bearer <initial AT>`
     header and/or a `software_statement` field (a JWT) inside the JSON body.

2. **`201 Created` registration response** — the most important thing to read.
   - `client_id` — the assigned identity.
   - `client_secret` (+ `client_secret_expires_at`) — present only for confidential
     `token_endpoint_auth_method`s. Treat as a secret; do not screenshot into
     tickets.
   - `registration_access_token` — a long-lived, high-value bearer credential that
     can later rewrite `redirect_uris`. This is the credential to guard.
   - `registration_client_uri` — the per-client RFC 7592 management URL.

3. **`GET <registration_client_uri>`** — read the record back. Sends
   `Authorization: Bearer <registration_access_token>`; `200` returns the current
   metadata.

4. **`PUT <registration_client_uri>`** — update. Full metadata in the body; the
   `200` response may contain a **rotated** `registration_access_token` — if so, the
   old one is now dead.

5. **`DELETE <registration_client_uri>`** — deregister. `204 No Content`.

## Error responses to recognize

| Status | Body / meaning |
|---|---|
| `400` | `{"error":"invalid_redirect_uri"}` or `invalid_client_metadata` — the AS rejected the requested metadata |
| `401` | Missing / stale / stolen `registration_access_token` on a 7592 call |

## Decoding the software statement

If the request carried `software_statement`, split the JWT on `.` and base64url-
decode the payload. Its claims (`redirect_uris`, `software_id`,
`token_endpoint_auth_method`) **override** the plain JSON and are trusted only after
the AS verifies the signature against the issuing directory's keys.

## Note

The `registration_access_token` and any `client_secret` are secrets — in a real
capture, redact them before sharing. All sample material here is synthetic.
