---
title: "Enhanced Client or Proxy (ECP) Profile — Client Snippets"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Enhanced Client or Proxy (ECP) Profile — Client Snippets

> All values below are **synthetic and sanitized** — placeholder base64, example.com/example.net hosts, and fake NameIDs. Never paste real assertions, certificates, or credentials into these commands.

ECP is a **non-browser** profile over reverse-SOAP (PAOS). The SAML messages travel as inline XML inside SOAP envelopes — they are **not** DEFLATE/base64 encoded the way the Redirect/POST bindings are. The general Redirect encoding is shown first for reference, then the actual PAOS `curl` exchange and an lxml/python3-saml example.

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

## `curl` — the PAOS / ECP exchange

### 1. Ask the SP for the resource, advertising ECP

```bash
curl -i https://sp.example.com/protected/resource \
  -H 'Accept: application/vnd.paos+xml' \
  -H 'PAOS: ver="urn:liberty:paos:2003-08";"urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"'
# -> 200 with a SOAP envelope: paos:Request (responseConsumerURL), ecp:Request, and the AuthnRequest
```

### 2. Forward the AuthnRequest to the IdP's SOAP ECP endpoint, authenticating directly

```bash
curl -i -u 'jordan.doe:SYNTHETIC-PASSWORD' \
  -H 'Content-Type: text/xml; charset=utf-8' \
  --data-binary @idp-soap-request.xml \
  https://idp.example.net/idp/profile/SAML2/SOAP/ECP
# -> SOAP envelope with ecp:Response (AssertionConsumerServiceURL) + the signed SAML Response
```

### 3. Compare URLs, then POST the Response back to the SP ACS as PAOS

```bash
# MUST verify: SP responseConsumerURL == IdP AssertionConsumerServiceURL, else send a SOAP fault
curl -i -X POST https://sp.example.com/saml/acs \
  -H 'Content-Type: application/vnd.paos+xml; charset=utf-8' \
  --data-binary @sp-acs-paos.xml
# -> the SP establishes a session and returns the originally requested resource
```

## SDK / library example — build the ECP request with lxml

```python
from lxml import etree

NS = {
    "S": "http://schemas.xmlsoap.org/soap/envelope/",
    "paos": "urn:liberty:paos:2003-08",
    "ecp": "urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp",
    "samlp": "urn:oasis:names:tc:SAML:2.0:protocol",
}

def strip_soap_and_relaystate(sp_paos_xml: bytes):
    root = etree.fromstring(sp_paos_xml)
    relay_state = root.find(".//ecp:RelayState", NS)     # keep to replay to the IdP + SP
    authn_request = root.find(".//samlp:AuthnRequest", NS)
    rcu = root.find(".//paos:Request", NS).get("responseConsumerURL")
    return authn_request, relay_state, rcu
```

The Shibboleth `ecp.sh` client and `python3-saml` handle the envelope wrapping/unwrapping;
the security-critical step your code must not skip is the `responseConsumerURL` vs
`AssertionConsumerServiceURL` comparison before step 3.
