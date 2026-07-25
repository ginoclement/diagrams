---
title: "HTTP Basic Authentication — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7617, RFC 7616"
---

# HTTP Basic Authentication — Client Snippets

Runnable client snippets for HTTP Basic auth (RFC 7617). All hosts, usernames, and
passwords below are **synthetic** placeholders — swap in your own. Remember: the
credential is replayed on **every** request, and Basic **must** run over TLS.

## 1. Unauthenticated request → 401 challenge

```bash
curl -i https://api.example.com/metrics
# -> 401 Unauthorized
# -> WWW-Authenticate: Basic realm="Metrics", charset="UTF-8"
```

## 2. Send credentials with `Authorization: Basic`

```bash
# Let curl build and base64-encode the header for you:
curl -i -u alice:s3cr3t-synthetic https://api.example.com/metrics
# -> 200 OK

# Equivalent explicit header (base64("alice:s3cr3t-synthetic") = YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==):
curl -i \
  -H "Authorization: Basic YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==" \
  https://api.example.com/metrics
```

## 3. Build / decode the header manually

```bash
# Encode:
printf 'alice:s3cr3t-synthetic' | base64
# -> YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==

# Decode (proves it is reversible — encoding, NOT encryption):
printf 'YWxpY2U6czNjcjN0LXN5bnRoZXRpYw==' | base64 -d
# -> alice:s3cr3t-synthetic
```

## SDK / library example (Python requests)

```python
import requests
from requests.auth import HTTPBasicAuth

# requests attaches "Authorization: Basic ..." on EVERY call in the session.
resp = requests.get(
    "https://api.example.com/metrics",
    auth=HTTPBasicAuth("alice", "s3cr3t-synthetic"),
)
print(resp.status_code)  # 200

# There is no logout: the client simply keeps replaying the credential.
# Anti-pattern reminder — over plain HTTP the password is sent in the clear:
#   requests.get("http://api.example.com/metrics", auth=("alice", "s3cr3t-synthetic"))  # DON'T
```

---

**Synthetic note:** `alice` / `s3cr3t-synthetic` and the base64 above are fabricated
for documentation. Base64 is not a secret-protecting transform — never treat a Basic
header as confidential on its own. No real credentials appear here.
