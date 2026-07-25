---
title: "Single Logout — IdP-Initiated — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Single Logout — IdP-Initiated — Reading it in DevTools

Open the browser DevTools **Network** tab before you start, enable **Preserve log** (the flow crosses several redirects and domains, and the ACS step navigates away), and keep **Disable cache** on. You are looking for the front-channel SAML messages as they hop between the SP and the IdP.

1. **The IdP-initiated `LogoutRequest` fan-out.** Clicking "Sign out" on the portal kills
   the IdP session, then the IdP sends a `LogoutRequest` to **each** participant SP — either a
   sequential redirect chain or **parallel hidden iframes**, each a request to a URL like
   `https://sp.example.com/saml/slo?SAMLRequest=...` (Redirect binding: **URL-decode → base64-decode → INFLATE**). Check
   `NameID` and the per-SP `SessionIndex`. There is no initiating SP `LogoutRequest` here — the
   IdP is the origin. Enable **Preserve log**; iframe requests are easy to miss otherwise.
2. **Each SP's `LogoutResponse` back to the IdP.** Every SP kills its local session and returns
   a `302`/POST to `https://idp.example.net/slo/response` carrying a **`SAMLResponse`** (LogoutResponse).
   Blocked third-party cookies/frames can cause these to be lost — you'll see the request start
   but no session actually cleared (a silent partial logout).
3. **The IdP result page.** The IdP aggregates the responses and renders its own logout page
   reporting complete or `PartialLogout`. (Back-channel SOAP variants happen server-to-server
   and are invisible to the browser.)

## RelayState

**`RelayState`** may accompany each leg so the IdP can correlate responses; treat it as
untrusted and validate any redirect target derived from it.

## Make the XML readable

Strongly recommended: install the **SAML Tracer** (Firefox/Chrome) or **Auth Inspector**
extension. It sits in the request stream, auto-detects `SAMLRequest`/`SAMLResponse`/`SAMLart`,
and shows the **decoded, pretty-printed XML** (handling the URL-decode → base64 → inflate chain
for you) — far less error-prone than doing it by hand.

Manual decode, for when you can't install an extension:

```bash
# Redirect binding (SAMLRequest / LogoutRequest): url-decode, base64 -d, then raw-inflate
python3 - <<'PY'
import base64, zlib, urllib.parse, sys
param = "PASTE_SAMLRequest_VALUE_HERE"
raw = base64.b64decode(urllib.parse.unquote_plus(param))
print(zlib.decompress(raw, -15).decode())   # -15 = raw DEFLATE, no zlib header
PY

# POST binding (SAMLResponse / LogoutResponse): base64 only, NO inflate
echo 'PASTE_SAMLResponse_VALUE_HERE' | base64 -d | xmllint --format -
```
