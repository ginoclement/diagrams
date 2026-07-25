---
title: "IdP-Initiated Web Browser SSO — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# IdP-Initiated Web Browser SSO — Reading it in DevTools

Open the browser DevTools **Network** tab before you start, enable **Preserve log** (the flow crosses several redirects and domains, and the ACS step navigates away), and keep **Disable cache** on. You are looking for the front-channel SAML messages as they hop between the SP and the IdP.

1. **The app-tile launch (no `AuthnRequest`).** Clicking a tile on the IdP portal
   issues a `GET` like `https://idp.example.net/app/launch/app-0007`. There is **no `SAMLRequest`** on
   the wire anywhere in this flow — that is the defining trait of IdP-initiated SSO. The IdP
   builds the response entirely on its own.
2. **The IdP login POSTs (often skipped).** If the portal session is already live there is no
   credential `POST` — you jump straight to step 3. Otherwise you'll see `POST`s to
   `https://idp.example.net/...` with `username`/`password`/`otp` before the portal renders.
3. **The unsolicited auto-POST to the ACS.** The portal returns an HTML page that auto-submits
   a form to `https://sp.example.com/saml/acs`. Open **Payload / Form Data**: base64-decode the **`SAMLResponse`**
   (POST binding, **no inflate**). Confirm the decoded `Response` has **NO `InResponseTo`**
   attribute and no `SubjectConfirmationData/@InResponseTo` — an unsolicited response must not
   carry one. Check `Issuer`, `Conditions`/`Audience`, `Subject/NameID`, `AuthnStatement`.

## RelayState

Here **`RelayState`** is chosen by the IdP (configured per app tile) and used by the SP as the
post-login deep link. It only appears from step 3 onward. The SP must validate/allow-list it —
it is attacker-influencable in some portals.

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
