---
title: "Rich Authorization Requests — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 9396"
---

# Rich Authorization Requests — DevTools Walkthrough

How to read a RAR exchange in the Network tab. The signature of RAR is an
`authorization_details` JSON array on `/authorize`, and — the part people miss —
the **granted** `authorization_details` echoed back in the token response, which
may be narrower than what was requested.

All values referenced below are **synthetic** (see [samples/](./samples/README.md)).

## Observable requests, in order

1. **`GET https://as.example.com/authorize?...`** — the RAR request.
   - Find the `authorization_details` query parameter (URL-decode it). It is a JSON
     array; each object has a `type` plus members like `locations`, `actions`,
     `instructedAmount`, `creditorAccount`.
   - In FAPI deployments this is usually not visible as a raw query param — it is
     inside a signed `request` object or was pushed via PAR (you would instead see a
     `request_uri`). Decode the request object to see it.

2. **Consent screen** — the AS should render the exact details (amount, creditor,
   action), not a generic scope name.

3. **`302` redirect** back to `redirect_uri` with `code` + `state` (standard).

4. **`POST https://as.example.com/token`** — redemption.
   - The `200` body contains a top-level **`authorization_details`** array: the
     **granted** set. Compare it field-by-field against what you requested in step 1.
     A partial grant (downscope) means the client must adapt — never assume the
     request was granted verbatim.
   - If the access token is a JWT, decode it: the same granted `authorization_details`
     appear as a claim.

5. **`POST https://api.example.com/payments`** — the API call.
   - `201` when the request falls within a granted detail (matching `location`,
     `action`, and constraints like amount).

## Error / variant signatures

| Symptom | Meaning |
|---|---|
| `302 ...?error=invalid_authorization_details` | Unknown or malformed `type` — AS rejected it |
| Token `authorization_details` ⊂ request | Partial grant / downscoping — read the granted set |
| API `403 insufficient_authorization` | Call outside the granted `locations`/`actions` |

## What to decode

| Artifact | Where | How to read it |
|---|---|---|
| Requested details | `authorization_details` on `/authorize` (or inside request object) | URL-decode / decode JWT; inspect each object's `type` |
| Granted details | token response body `authorization_details` | compare to request; this is authoritative |
| Access token claim | token response `access_token` (if JWT) | base64url-decode; `authorization_details` claim |

## Note

`authorization_details` can carry sensitive data (amounts, account IDs) — redact in
real captures. All sample material here is synthetic.
