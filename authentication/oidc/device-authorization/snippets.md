---
title: "Device Authorization Grant (RFC 8628) — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Authorization Grant (RFC 8628) — Client Snippets

Runnable client snippets for the [Device Authorization grant](./README.md). All values are
**synthetic**. The device is a **public client** — no secret. The user approves on a **separate
device** (phone/laptop) while the device polls the token endpoint.

```sh
# Shared environment (synthetic)
export IDP="https://idp.example.com"
export CLIENT_ID="tv-device-app-01"
```

## 1. Start the flow — `POST /device_authorization`

```sh
curl -s -X POST "$IDP/device_authorization" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "scope=openid profile" | jq
```

Example response (synthetic):

```json
{
  "device_code": "dc_synthetic_GmRhmhcxhw...AZ",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://idp.example.com/activate",
  "verification_uri_complete": "https://idp.example.com/activate?user_code=WDJB-MJHT",
  "expires_in": 900,
  "interval": 5
}
```

The device shows the user `user_code` and `verification_uri` (often the
`verification_uri_complete` as a QR code).

## 2. User approves on a second device (out of band)

The user opens `verification_uri` on a phone, signs in, enters `WDJB-MJHT`, and consents. The
device does not observe this step.

## 3. Poll for the token — `POST /token`

Poll every `interval` seconds. While pending you get HTTP `400` with `error=authorization_pending`.

```sh
export DEVICE_CODE="dc_synthetic_GmRhmhcxhwAZ"

curl -s -X POST "$IDP/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
  -d "device_code=$DEVICE_CODE" \
  -d "client_id=$CLIENT_ID" | jq
```

- `authorization_pending` → wait `interval` seconds, poll again.
- `slow_down` → add 5 seconds to `interval`, then poll.
- `access_denied` → user declined; stop.
- `expired_token` → restart from step 1 with a fresh code.
- Success → `access_token`, `id_token`, `expires_in`, optional `refresh_token`.

## Bounded polling loop (shell)

```sh
interval=5
while :; do
  resp=$(curl -s -X POST "$IDP/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
    -d "device_code=$DEVICE_CODE" -d "client_id=$CLIENT_ID")
  err=$(echo "$resp" | jq -r '.error // empty')
  case "$err" in
    "") echo "$resp" | jq; break ;;                 # got tokens
    authorization_pending) sleep "$interval" ;;
    slow_down) interval=$((interval + 5)); sleep "$interval" ;;
    *) echo "stop: $err"; break ;;                  # access_denied / expired_token
  esac
done
```

## SDK example (Python, `requests` — mirrors real device-flow libraries)

```python
import time, requests

IDP = "https://idp.example.com"
CLIENT_ID = "tv-device-app-01"

# Step 1
da = requests.post(f"{IDP}/device_authorization",
                   data={"client_id": CLIENT_ID, "scope": "openid profile"}).json()
print(f"Go to {da['verification_uri']} and enter {da['user_code']}")

# Step 3: poll
interval = da.get("interval", 5)
while True:
    r = requests.post(f"{IDP}/token", data={
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        "device_code": da["device_code"],
        "client_id": CLIENT_ID,
    })
    body = r.json()
    if r.status_code == 200:
        print(body["access_token"]); break
    if body.get("error") == "authorization_pending":
        time.sleep(interval)
    elif body.get("error") == "slow_down":
        interval += 5; time.sleep(interval)
    else:
        raise SystemExit(body.get("error"))  # access_denied / expired_token
```

---

**All values in this file are synthetic.** Device codes, user codes, and tokens are fake strings.
