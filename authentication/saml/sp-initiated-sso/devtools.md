---
title: "SP-Initiated Web Browser SSO — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# SP-Initiated Web Browser SSO — Reading it in DevTools

Open the browser DevTools **Network** tab before you start, enable **Preserve log** (the flow crosses several redirects and domains, and the ACS step navigates away), and keep **Disable cache** on. You are looking for the front-channel SAML messages as they hop between the SP and the IdP.

1. **The `AuthnRequest` redirect to the IdP.** Clicking the protected SP link
   produces a `302` (or a `200` with an auto-submit form) to
   `https://idp.example.net/sso/redirect?SAMLRequest=...&RelayState=...&SigAlg=...&Signature=...`.
   Select it and open **Headers → Query String Parameters**. To read the `SAMLRequest`:
   **URL-decode → base64-decode → INFLATE (raw DEFLATE)** to recover the `AuthnRequest` XML.
   Check `Issuer`, `Destination`, `AssertionConsumerServiceURL`, and the request `ID`
   (this becomes `InResponseTo` later).
2. **The IdP login POSTs.** One or more `POST`s to `https://idp.example.net/...` as the user submits
   credentials / MFA (form fields such as `username`, `password`, `otp`). With a live IdP
   session these may be absent (seamless SSO). Cookies on the IdP domain carry the session.
3. **The auto-POST to the ACS.** The IdP returns an HTML page that auto-submits a form to
   `https://sp.example.com/saml/acs`. In the Network tab select that `POST` and open **Payload / Form Data**: the
   `SAMLResponse` field is **base64-only — base64-decode straight to XML, do NOT inflate**
   (POST binding). Read `InResponseTo` (must equal the step-1 request `ID`), `Issuer`,
   `Conditions`/`Audience`, `Subject/NameID`, and `AuthnStatement`.

## RelayState

Follow **`RelayState`** through all three steps — it round-trips opaquely from the step-1
redirect to the step-3 form field and tells the SP where to land the user after login.
Treat it as untrusted input; the SP must allow-list it to prevent open redirects.

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
