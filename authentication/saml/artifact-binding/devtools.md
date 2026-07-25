---
title: "HTTP-Artifact Binding — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# HTTP-Artifact Binding — Reading it in DevTools

Open the browser DevTools **Network** tab before you start, enable **Preserve log** (the flow crosses several redirects and domains, and the ACS step navigates away), and keep **Disable cache** on. You are looking for the front-channel SAML messages as they hop between the SP and the IdP.

1. **The `AuthnRequest` redirect to the IdP.** Same as POST-binding SSO: a `302` to
   `https://idp.example.net/sso/redirect?SAMLRequest=...&RelayState=...`. **URL-decode → base64-decode →
   INFLATE** the `SAMLRequest` to read the `AuthnRequest` (note it requests the **HTTP-Artifact**
   `ProtocolBinding`). Check `Issuer`, `Destination`, `AssertionConsumerServiceURL`, request `ID`.
2. **The IdP login POSTs.** Credential/MFA `POST`s to `https://idp.example.net/...` (absent under a live
   IdP session).
3. **The redirect back to the ACS carrying only `SAMLart`.** Crucially, the browser is `302`'d
   to `https://sp.example.com/saml/acs?SAMLart=...&RelayState=...`. Open **Query String Parameters**: you'll see a short
   opaque **`SAMLart`** artifact — **there is NO `SAMLResponse` and NO assertion in the browser**.
   The SP dereferences the artifact over a **back-channel SOAP `ArtifactResolve`** to the IdP's
   ARS, which is server-to-server and **does not appear in the Network tab**. That is the whole
   point of the artifact binding: the assertion never transits the front channel.

## RelayState

**`RelayState`** rides alongside `SAMLart` in step 3 (not the assertion). Validate it as usual.

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
