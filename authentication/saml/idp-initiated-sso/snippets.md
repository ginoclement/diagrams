---
title: "IdP-Initiated Web Browser SSO — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# IdP-Initiated Web Browser SSO — Client Snippets

> All values below are **synthetic and sanitized** — placeholder base64, example.com/example.net hosts, and fake NameIDs. Never paste real assertions, certificates, or credentials into these commands.

IdP-initiated SSO has **no `AuthnRequest`** — the IdP sends an unsolicited `Response` straight to the ACS. So there is nothing to DEFLATE on the request side; the encoding snippet below is shown for reference (it is what SP-initiated SSO and SLO use), followed by the POST-binding decode you actually need here, a `curl` for the ACS POST, and an SDK example.

## DEFLATE + base64 + URL-encode a `SAMLRequest` (HTTP-Redirect binding)

For the **HTTP-Redirect** binding the `AuthnRequest` XML is raw-DEFLATE compressed
(no zlib header), base64-encoded, then URL-encoded into the `SAMLRequest` query parameter.

### Python

```python
import base64, zlib, urllib.parse

xml = b'<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_synthetic0001">...</samlp:AuthnRequest>'

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

const xml = '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_synthetic0001">...</samlp:AuthnRequest>';

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

## Decoding a POST-binding message (no inflate)

The `SAMLResponse` delivered by the HTTP-POST binding is base64-only:

```python
import base64
xml = base64.b64decode(form_field_value).decode()   # no zlib.decompress here
print(xml)
```

```js
const xml = Buffer.from(formFieldValue, "base64").toString();  // no inflate
```

## `curl` — the unsolicited ACS POST (HTTP-POST binding)

Note there is **no `InResponseTo`** in the decoded `SAMLResponse`, and the SP must be
configured to accept unsolicited responses:

```bash
curl -i -X POST https://sp.example.com/saml/acs \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'SAMLResponse=U1lOVEhFVElDX1NBTUxSZXNwb25zZV9iYXNlNjRfcGxhY2Vob2xkZXJfQkJCQkJCQkJCQkJCQkJCQkJDQ0NDQ0NDQ0NDQ0NEREREREREREQ' \
  --data-urlencode 'RelayState=cmVsYXlzdGF0ZS1zeW50aGV0aWMtL2FwcC9kYXNoYm9hcmQ'
# RelayState here is the IdP-chosen deep-link target inside the SP
```

## SDK example — python3-saml (OneLogin)

```python
from onelogin.saml2.auth import OneLogin_Saml2_Auth

def acs(req):
    auth = OneLogin_Saml2_Auth(req, custom_base_path="/etc/saml")
    # For unsolicited responses there is no stored request id to match:
    auth.process_response()                     # request_id=None -> InResponseTo must be ABSENT
    if auth.is_authenticated():
        landing = auth.get_settings()  # validate RelayState against an allow-list yourself!
        return auth.get_nameid(), auth.get_attributes()
    raise PermissionError(auth.get_errors())
```

Set `security.rejectUnsolicitedResponsesWithInResponseTo = true` so a response that *does*
carry `InResponseTo` without a matching pending request is rejected. Always allow-list the
`RelayState` deep link before redirecting.
