---
title: "Single Logout — IdP-Initiated — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Single Logout — IdP-Initiated — Client Snippets

> All values below are **synthetic and sanitized** — placeholder base64, example.com/example.net hosts, and fake NameIDs. Never paste real assertions, certificates, or credentials into these commands.

Snippets for the Single Logout messages: encoding a `LogoutRequest` for the HTTP-Redirect binding, POSTing/redirecting the `LogoutResponse`, and driving SLO from an SDK. In this flow the IdP initiates logout.

## DEFLATE + base64 + URL-encode a `SAMLRequest` (HTTP-Redirect binding)

For the **HTTP-Redirect** binding the `LogoutRequest` XML is raw-DEFLATE compressed
(no zlib header), base64-encoded, then URL-encoded into the `SAMLRequest` query parameter.

### Python

```python
import base64, zlib, urllib.parse

xml = b'<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_synthetic0001">...</samlp:LogoutRequest>'

# encode (what the sender does)
deflated = zlib.compress(xml, 9)[2:-4]          # strip zlib header + adler32 -> raw DEFLATE
b64 = base64.b64encode(deflated).decode()
param = urllib.parse.quote_plus(b64)
print(param)

# decode (what you do when inspecting a capture)
raw   = urllib.parse.unquote_plus(param)
comp  = base64.b64decode(raw)
xml2  = zlib.decompress(comp, -15)              # negative wbits = raw DEFLATE, no header
print(xml2.decode())
```

### Node.js

```js
const zlib = require("zlib");

const xml = '<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_synthetic0001">...</samlp:LogoutRequest>';

// encode
const b64 = zlib.deflateRawSync(Buffer.from(xml)).toString("base64");
const param = encodeURIComponent(b64);
console.log(param);

// decode
const xml2 = zlib.inflateRawSync(
  Buffer.from(decodeURIComponent(param), "base64")
).toString();
console.log(xml2);
```

> POST binding is different: the `SAMLResponse` in an auto-submitted form is **only base64-encoded, not DEFLATE-compressed** — base64-decode straight to XML, no inflate step.

## Decoding the `LogoutResponse` (POST binding, no inflate)

```python
import base64
xml = base64.b64decode(saml_response_field).decode()   # LogoutResponse XML
print(xml)   # check Status -> Success or PartialLogout
```

## `curl` — a Redirect-binding `LogoutRequest`

HTTP-Redirect delivers the signed `LogoutRequest` as query parameters:

```bash
curl -i -G 'https://sp.example.com/saml/slo' \
  --data-urlencode 'SAMLRequest=U1lOVEhFVElDX0xvZ291dFJlcXVlc3RfREVGTEFURV9iYXNlNjRfcGxhY2Vob2xkZXJfRUVFRUVFRUVFRUVFRUVFRg' \
  --data-urlencode 'RelayState=cmVsYXlzdGF0ZS1zeW50aGV0aWMtL2FwcC9kYXNoYm9hcmQ' \
  --data-urlencode 'SigAlg=http://www.w3.org/2001/04/xmldsig-more#rsa-sha256' \
  --data-urlencode 'Signature=U1lOVEhFVElDX1NJR05BVFVSRV9CQVNFNjQ='
```

The final `LogoutResponse` comes back the same way (or as a POST form field
`SAMLResponse=U1lOVEhFVElDX0xvZ291dFJlc3BvbnNlX2Jhc2U2NF9wbGFjZWhvbGRlcl9GRkZGRkZGRkZGRkZGRkZG`).

## SDK example — python3-saml (OneLogin)

```python
from onelogin.saml2.auth import OneLogin_Saml2_Auth

def logout(req, name_id, session_index):
    auth = OneLogin_Saml2_Auth(req, custom_base_path="/etc/saml")
    # builds a signed LogoutRequest and returns the redirect to the IdP SLO endpoint
    return auth.logout(name_id=name_id, session_index=session_index,
                       return_to="/goodbye")     # return_to becomes RelayState

def slo(req):
    auth = OneLogin_Saml2_Auth(req, custom_base_path="/etc/saml")
    url = auth.process_slo(keep_local_session=False)   # validates signature, kills local session
    errors = auth.get_errors()                          # inspect for PartialLogout / bad signature
    return url, errors
```
