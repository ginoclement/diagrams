---
title: "Single Logout — SP-Initiated — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Single Logout — SP-Initiated — Reading it in DevTools

Open the browser DevTools **Network** tab before you start, enable **Preserve log** (the flow crosses several redirects and domains, and the ACS step navigates away), and keep **Disable cache** on. You are looking for the front-channel SAML messages as they hop between the SP and the IdP.

1. **The `LogoutRequest` redirect (SP → IdP).** Clicking "Logout" at the SP issues a
   `302` to `https://idp.example.net/slo/redirect?SAMLRequest=...&RelayState=...&SigAlg=...&Signature=...`.
   The `SAMLRequest` here is a **`LogoutRequest`** — **URL-decode → base64-decode → INFLATE**
   to read it. Check `Issuer`, `NameID`, and `SessionIndex` (they identify the session to kill).
2. **The IdP's propagation to other SPs.** The IdP kills its own session, then front-channels
   the browser to each participant SP's SLO endpoint in turn — a chain of `302`s / auto-POST
   forms to `https://sp2.example.com/saml/slo` etc., each carrying its own `SAMLRequest`
   (LogoutRequest) and returning a `SAMLResponse` (LogoutResponse). (Back-channel SOAP
   propagation is server-to-server and will **not** appear in the browser Network tab.)
3. **The final `LogoutResponse` (IdP → initiating SP).** A `302`/POST back to
   `https://sp.example.com/saml/slo` with a **`SAMLResponse`** field. Redirect-binding: inflate;
   POST-binding: base64 only. Read `Status` — `Success` or a second-level `PartialLogout`.

## RelayState

**`RelayState`** round-trips so the initiating SP can show the right "you are signed out" page
at the end. As with SSO, validate it.

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
