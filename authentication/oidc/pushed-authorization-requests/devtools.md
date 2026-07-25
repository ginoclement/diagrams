---
title: "Pushed Authorization Requests (PAR, RFC 9126) — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9126"
---

# Pushed Authorization Requests (PAR, RFC 9126) — DevTools Walkthrough

How to observe PAR. Mixed channels here: the **push** and the **token** exchange are
back-channel; the **authorize** redirect is browser-visible.

> The whole point of PAR is that the authorization parameters **do not** appear in
> the browser URL. So in the Network tab you will see a `/authorize` request carrying
> only `client_id` and `request_uri` — not `scope`, `redirect_uri`,
> `code_challenge`, etc. Those were pushed on the back channel (step 1) and are
> invisible to the browser.

Observable requests, in order:

## 1. `POST /par` — client to AS (back-channel, NOT in browser)

- **Where:** client server logs / AS access logs. Reproduce with the `curl` in
  [snippets.md](./snippets.md).
- **Request to read (URL-decode the form body):** the **full** authorization
  request — `response_type`, `client_id`, `redirect_uri`, `scope`,
  `code_challenge` + `code_challenge_method`, `state`, `nonce`, and any
  `authorization_details` (RAR). Plus `Authorization: Basic ...` client auth.
- **Response to read:**
  - Status `201 Created`, `Cache-Control: no-store`.
  - `request_uri` — e.g.
    `urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c`. This is the
    single-use handle returned by the push.
  - `expires_in` — short TTL (commonly ~60s). The client must redirect before it
    lapses.
  - Client-auth failure returns `401 invalid_client`.

## 2. `GET /authorize?client_id&request_uri` — browser to AS (browser-visible)

- **Where:** browser Network tab. This is the request to inspect in DevTools.
- **Filter:** filter by the AS host (`as.example.com`) or the `/authorize` path.
- **Query params to read:** you should see **only** `client_id` and `request_uri`.
  Confirm the long authorization parameters are **absent** from the URL — that is PAR
  working. The AS resolves `request_uri` to the stored request and **ignores** any
  extra query params.
- **Response:** an HTML login page (or a `302` if already authenticated).
- **Error cases to watch:** a stale/used `request_uri` yields `invalid_request_uri`;
  a plain `/authorize` with no `request_uri` when the AS requires PAR yields
  `invalid_request`.

## 3. `GET redirect_uri?code&state` — AS back to client (browser-visible)

- **Where:** browser Network tab — a `302` to `https://app.example.com/cb?...`.
- **What to read:** `code` (single-use authorization code) and `state` (must equal
  the `state` you pushed in step 1 — CSRF check).

## 4. `POST /token` — client to AS (back-channel, NOT in browser)

- **Where:** client server logs / AS access logs.
- **What to read:** `grant_type=authorization_code`, `code`, `redirect_uri`, and the
  PKCE `code_verifier`. The AS recomputes S256(`code_verifier`) and matches it to the
  `code_challenge` that was pushed in step 1.

See [samples/pushed-authorization-requests.har](./samples/pushed-authorization-requests.har)
and the annotated push + `request_uri` in [samples/README.md](./samples/README.md).
