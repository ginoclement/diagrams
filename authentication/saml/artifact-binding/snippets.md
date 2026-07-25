---
title: "HTTP-Artifact Binding — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# HTTP-Artifact Binding — Client Snippets

> All values below are **synthetic and sanitized** — placeholder base64, example.com/example.net hosts, and fake NameIDs. Never paste real assertions, certificates, or credentials into these commands.

Practical snippets for building and consuming the SAML messages in this flow: encoding the `AuthnRequest` for the HTTP-Redirect binding, POSTing to the ACS with `curl`, and driving the flow from an SDK.

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

## `curl` — the ACS POST (HTTP-POST binding)

The browser normally auto-submits this form; here it is by hand:

```bash
curl -i -X POST https://sp.example.com/saml/acs \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'SAMLResponse=U1lOVEhFVElDX1NBTUxSZXNwb25zZV9iYXNlNjRfcGxhY2Vob2xkZXJfQkJCQkJCQkJCQkJCQkJCQkJDQ0NDQ0NDQ0NDQ0NEREREREREREQ' \
  --data-urlencode 'RelayState=cmVsYXlzdGF0ZS1zeW50aGV0aWMtL2FwcC9kYXNoYm9hcmQ'
# -> 302 to the RelayState target once the SP accepts the assertion and sets its session cookie
```

## `curl` — back-channel `ArtifactResolve` (SOAP, mutually authenticated TLS)

With the artifact binding the browser only carries `SAMLart`; the SP dereferences it
server-to-server:

```bash
curl -i -X POST https://idp.example.net/saml/ars \
  --cert sp-client.pem --key sp-client.key \
  -H 'Content-Type: text/xml; charset=utf-8' \
  -H 'SOAPAction: http://www.oasis-open.org/committees/security' \
  --data-binary @artifact-resolve.xml
# artifact-resolve.xml wraps a samlp:ArtifactResolve containing <samlp:Artifact>AAQAAJ2Fm/RSYNTHETICartifactPLACEHOLDERaGVsbG89PT0</samlp:Artifact>
```

## SDK example — python3-saml (OneLogin)

```python
from onelogin.saml2.auth import OneLogin_Saml2_Auth

# `req` is a framework-agnostic dict built from the incoming HTTP request
def sso_login(req):
    auth = OneLogin_Saml2_Auth(req, custom_base_path="/etc/saml")
    # builds the DEFLATE+base64 SAMLRequest and returns the redirect URL to the IdP
    return auth.login(return_to="/app/dashboard")   # return_to becomes RelayState

def acs(req):
    auth = OneLogin_Saml2_Auth(req, custom_base_path="/etc/saml")
    auth.process_response()                          # verifies signature, conditions, InResponseTo
    if auth.is_authenticated():
        return {
            "name_id": auth.get_nameid(),
            "session_index": auth.get_session_index(),
            "attributes": auth.get_attributes(),
        }
    raise PermissionError(auth.get_errors())
```

Settings (`settings.json`) point `idp.singleSignOnService.url` at `https://idp.example.net/sso/redirect`
and `sp.assertionConsumerService.url` at `https://sp.example.com/saml/acs`, with the IdP's x509 cert from **metadata**.
