---
title: "IdP-Initiated Web Browser SSO — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# IdP-Initiated Web Browser SSO — Sample Capture

> **Fully synthetic and sanitized.** Every ID, timestamp, NameID, host, certificate, and signature below is a placeholder. Nothing here is a real assertion, key, or person.

- HAR capture: [`idp-initiated-sso.har`](./idp-initiated-sso.har) — HTTP-level view of the exchange (load it into the browser Network tab or a HAR viewer).

The base64 blobs in the HAR decode (conceptually) to the annotated XML below.

## No `AuthnRequest`

IdP-initiated SSO has **no request message** — the flow begins with the IdP emitting the unsolicited `Response` below. The decoded response therefore carries **no `InResponseTo`**.

## Decoded `Response` + `Assertion` (IdP → SP, at the ACS)

Delivered base64-encoded (POST binding, no DEFLATE) in the `SAMLResponse` form field.

```xml
<samlp:Response
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_synthetic-resp-000000000000000000000001"
    Version="2.0"
    IssueInstant="2026-07-25T15:04:10Z"
    Destination="https://sp.example.com/saml/acs">
  <saml:Issuer>https://idp.example.net/saml/metadata</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion
      ID="_synthetic-assert-00000000000000000000001"
      Version="2.0"
      IssueInstant="2026-07-25T15:04:10Z">
    <saml:Issuer>https://idp.example.net/saml/metadata</saml:Issuer>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <!-- SYNTHETIC placeholder signature - not a real XML-DSig -->
      <ds:SignedInfo>...</ds:SignedInfo>
      <ds:SignatureValue>U1lOVEhFVElDX1NJR05BVFVSRV9WQUxVRV9QTEFDRUhPTERFUg==</ds:SignatureValue>
      <ds:KeyInfo><ds:X509Data><ds:X509Certificate>SYNTHETIC_CERT_PLACEHOLDER</ds:X509Certificate></ds:X509Data></ds:KeyInfo>
    </ds:Signature>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">
        S-1-5-21-SYNTHETIC-USER-abc123
      </saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData
            NotOnOrAfter="2026-07-25T15:09:10Z"
            Recipient="https://sp.example.com/saml/acs"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions
        NotBefore="2026-07-25T15:04:05Z"
        NotOnOrAfter="2026-07-25T15:09:10Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://sp.example.com/saml/metadata</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement
        AuthnInstant="2026-07-25T15:04:09Z"
        SessionIndex="_synthetic-session-0000000000001">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="urn:oid:0.9.2342.19200300.100.1.3" FriendlyName="mail">
        <saml:AttributeValue>jordan.doe@example.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="urn:oid:2.5.4.3" FriendlyName="cn">
        <saml:AttributeValue>Jordan Doe</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

Annotated key elements:

- **`Response/Issuer`** — the IdP entityID; validated against IdP metadata before trusting anything.
- **`Destination`** — the SP ACS URL this response is bound to.
- **`InResponseTo`** — **absent** — this is an unsolicited IdP-initiated response, so there is no request to correlate to.
- **`Status/StatusCode`** — `...:status:Success` gates acceptance; `Responder`/`AuthnFailed` mean reject.
- **`Signature`** — XML-DSig over the Response and/or Assertion (placeholder here); verify with the IdP cert from metadata **before** reading content, and guard against XML Signature Wrapping.
- **`Subject/NameID`** — the federated user identifier (synthetic persistent id).
- **`SubjectConfirmationData`** — `Recipient` (= ACS URL), `NotOnOrAfter` (short bearer window), and `InResponseTo`.
- **`Conditions`** with **`AudienceRestriction/Audience`** — must name this SP's entityID; `NotBefore`/`NotOnOrAfter` bound validity (allow small clock skew).
- **`AuthnStatement`** — `AuthnInstant`, `SessionIndex` (needed later for Single Logout), and the `AuthnContextClassRef` actually met.
- **`AttributeStatement`** — released user attributes (synthetic mail/cn).
