---
title: "JAR / JARM — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9101"
---

# JAR / JARM — DevTools Walkthrough

How to read a JAR/JARM exchange in the browser Network tab. The tell-tale signs
are: a `request=` (or `request_uri=`) parameter on `/authorize` instead of the
usual bare query params, and a `response=` JWT on the redirect back instead of a
bare `code`.

All values referenced below are **synthetic** (see [samples/](./samples/README.md)).

## Observable requests, in order

1. **`GET https://as.example.com/authorize?...`** — the JAR request.
   - In the Query String, most parameters are **gone**; you see only
     `client_id`, `response_type`, and a big `request=eyJ...` (JAR by value) or a
     `request_uri=https://...` (JAR by reference).
   - Copy the `request` JWT, split on `.`, base64url-decode the payload: you will
     find the real `redirect_uri`, `scope`, `state`, `nonce`, `code_challenge`, and
     `response_mode: "jwt"`. The header shows `typ: "oauth-authz-req+jwt"`.

2. **(By reference only) the AS fetching the `request_uri`** — not visible in the
   browser (it is a server-to-server GET). In a proxy capture you would see the AS
   `GET https://client.example.com/req/abc123` returning the signed request object.

3. **`302` redirect back to `redirect_uri`** — the JARM response.
   - Look at the `Location` header. Instead of `?code=...&state=...` you see a
     single `?response=eyJ...` JWT (or `#response=...` for `fragment.jwt`, or a
     form POST body for `form_post.jwt`).
   - Decode the `response` JWT payload: `iss`, `aud`, `exp`, `code`, `state`.
   - **`iss` is the mix-up defense** — it must equal the AS you sent the request to.
     `aud` must equal your `client_id`. The client verifies the signature before
     trusting `code`.

4. **`POST https://as.example.com/token`** — code redemption.
   - Standard `grant_type=authorization_code` body with `code`, `redirect_uri`,
     `client_id`, `code_verifier`. `200` returns `id_token` + `access_token`.

## What to decode

| Artifact | Where | How to read it |
|---|---|---|
| Request object | `request=` on `/authorize` | base64url-decode payload; `typ: oauth-authz-req+jwt` |
| JARM response | `response=` on the redirect `Location` | decode payload; check `iss`, `aud`, then `code` |
| id_token | Step 4 token response | base64url-decode; check `nonce` matches the request object |

## Error signatures

| Symptom | Meaning |
|---|---|
| `302 ...?error=invalid_request_object` | AS rejected a bad/tampered request-object signature |
| Redirect `iss` != expected AS | Mix-up attempt — the client must discard and NOT redeem the code |

## Note

The request object and JARM response are integrity-protected JWTs; a value that
does not verify must be discarded. All sample material here is synthetic.
