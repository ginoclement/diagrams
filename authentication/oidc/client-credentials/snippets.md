---
title: "OAuth 2.0 Client Credentials Grant (Machine-to-Machine) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth 2.0 Client Credentials Grant (Machine-to-Machine) — Client Snippets

Runnable client snippets for the [Client Credentials grant](./README.md). All values are
**synthetic**. There is **no user and no browser** here — every call is server-to-server.

```sh
# Shared environment (synthetic)
export IDP="https://idp.example.com"
export CLIENT_ID="svc-report-runner"
export CLIENT_SECRET="cs_synthetic_9f8e7d6c5b4a3210"
export API="https://api.example.com"
```

## 1. Discover the endpoints (optional)

```sh
curl -s "$IDP/.well-known/openid-configuration" | jq '{token_endpoint, jwks_uri}'
```

## 2. Request a token — `client_secret_basic` (baseline)

```sh
curl -s -X POST "$IDP/token" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "scope=read:reports" | jq
```

Returns `access_token`, `token_type=Bearer`, `expires_in`, and the granted `scope` (which may be
narrower than requested). **No `id_token` and no `refresh_token`** — re-request when it expires.

## 2b. Request a token — `private_key_jwt` (no shared secret)

```sh
# $CLIENT_ASSERTION is a client-signed JWT (aud = token endpoint, iss = sub = client_id).
export CLIENT_ASSERTION="eyJ...synthetic-signed-jwt...SIG"

curl -s -X POST "$IDP/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "scope=read:reports" \
  -d "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  -d "client_assertion=$CLIENT_ASSERTION" | jq
```

## 3. Call the resource server

```sh
export ACCESS_TOKEN="at_synthetic_cc_11223344"
curl -s "$API/v1/reports" -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## 3b. On `401 invalid_token`, fetch a fresh token and retry once

```sh
status=$(curl -s -o /dev/null -w '%{http_code}' "$API/v1/reports" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
if [ "$status" = "401" ]; then
  # re-run step 2 to mint a new token, then retry the request exactly once
  echo "token rejected; refetch and retry once (bounded — do not loop)"
fi
```

## SDK example (Python, `requests-oauthlib`)

`requests-oauthlib` (with `oauthlib`'s `BackendApplicationClient`) is a common client-credentials
implementation.

```python
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session

client_id = "svc-report-runner"
client_secret = "cs_synthetic_9f8e7d6c5b4a3210"  # synthetic

client = BackendApplicationClient(client_id=client_id)
oauth = OAuth2Session(client=client)

# Step 2: fetch the token (client authenticates as itself; no user)
token = oauth.fetch_token(
    token_url="https://idp.example.com/token",
    client_id=client_id,
    client_secret=client_secret,
    scope="read:reports",
)

# Step 3: the session now attaches the bearer token automatically
resp = oauth.get("https://api.example.com/v1/reports")
print(resp.status_code)
# Cache `token` until near expiry; do not fetch a new token per request.
```

---

**All values in this file are synthetic.** Client secret, assertion, and tokens are fake strings
and authenticate against nothing.
