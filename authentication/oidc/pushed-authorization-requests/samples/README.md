---
title: "Pushed Authorization Requests (PAR, RFC 9126) — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9126"
---

# Pushed Authorization Requests (PAR, RFC 9126) — Sample Capture

Sanitized, **synthetic** capture artifacts for the PAR flow.

- [pushed-authorization-requests.har](./pushed-authorization-requests.har) — HAR 1.2
  with four entries: the back-channel `POST /par`, the browser `GET /authorize`
  carrying only `client_id` + `request_uri`, the `302` back to the redirect URI with
  `code` + `state`, and the back-channel `POST /token`.

All values are fabricated.

## The pushed request (`POST /par`)

```http
POST /par HTTP/1.1
Host: as.example.com
Authorization: Basic czZCaGRSa3F0MzpjbGktczNjcjN0LXNoaGg=   # base64("s6BhdRkqt3:cli-s3cr3t-shhh")
Content-Type: application/x-www-form-urlencoded

response_type=code
client_id=s6BhdRkqt3
redirect_uri=https://app.example.com/cb
scope=openid read:orders
code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
code_challenge_method=S256
state=af0ifjsldkj
nonce=n-0S6_WzA2Mj
```

Every authorization parameter is here, on the **back channel** — none of it will
touch the browser.

## The returned `request_uri` (`201 Created`)

```jsonc
{
  "request_uri": "urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c",
  "expires_in": 60   // seconds — single-use, short-lived handle
}
```

- `request_uri` — an opaque, single-use reference to the stored request. The client
  puts **only** this and `client_id` on the `/authorize` URL.
- `expires_in` — the client must redirect before this lapses; a stale or reused
  `request_uri` gets `invalid_request_uri` at `/authorize`.

## The resulting front-channel `/authorize` (browser)

```
GET https://as.example.com/authorize
      ?client_id=s6BhdRkqt3
      &request_uri=urn:ietf:params:oauth:request_uri:6esc_11ACC5bwc014ltc14eY22c
```

Contrast this with a non-PAR flow, where `scope`, `redirect_uri`, `code_challenge`,
`state`, and `nonce` would all be in the URL. Here they are absent — that is the
tamper-resistance and length benefit of PAR. The AS ignores any extra query params.

## The redirect back and code redemption

- `302 Location: https://app.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj`
  — `state` must equal the pushed value (CSRF check).
- `POST /token` sends `grant_type=authorization_code`, `code`, `redirect_uri`, and the
  PKCE `code_verifier` `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`, whose S256 hash
  matches the `code_challenge` pushed in step 1.

> **Synthetic-data note:** every client id, secret, code, PKCE verifier/challenge,
> `request_uri`, and token in this folder is fabricated for documentation and is not
> valid at any real authorization server.
