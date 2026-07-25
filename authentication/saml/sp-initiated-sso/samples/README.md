---
title: "SP-Initiated Web Browser SSO — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# SP-Initiated Web Browser SSO — Sample Capture

> **Fully synthetic and sanitized.** Every ID, timestamp, NameID, host, certificate, and signature below is a placeholder. Nothing here is a real assertion, key, or person.

- HAR capture: [`sp-initiated-sso.har`](./sp-initiated-sso.har) — HTTP-level view of the exchange (load it into the browser Network tab or a HAR viewer).

The base64 blobs in the HAR decode (conceptually) to the annotated XML below.

## Decoded `AuthnRequest` (SP → IdP)

Sent DEFLATE+base64+URL-encoded in the `SAMLRequest` query parameter (Redirect binding).

```xml
<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_synthetic-req-0000000000000000000000001"
    Version="2.0"
    IssueInstant="2026-07-25T15:04:05Z"
    Destination="https://idp.example.net/sso/redirect"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
    AssertionConsumerServiceURL="https://sp.example.com/saml/acs">
  <saml:Issuer>https://sp.example.com/saml/metadata</saml:Issuer>
  <samlp:NameIDPolicy
      Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
      AllowCreate="true"/>
  <samlp:RequestedAuthnContext Comparison="exact">
    <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
  </samlp:RequestedAuthnContext>
</samlp:AuthnRequest>
```

Annotated key elements:

- **`Issuer`** — the SP's entityID (`https://sp.example.com/saml/metadata`); the IdP uses it to select SP config and signing keys.
- **`Destination`** — the IdP SSO endpoint the request is bound to; the IdP rejects it if this does not match its own URL.
- **`AssertionConsumerServiceURL`** — where the SP wants the `Response` delivered; must match a registered ACS in SP metadata.
- **`ID`** — unique request id; it reappears as **`InResponseTo`** in the Response, binding the two together.
- **`NameIDPolicy`** / **`RequestedAuthnContext`** — the identifier format and authentication strength the SP is asking for.

## Decoded `Response` + `Assertion` (IdP → SP, at the ACS)

Delivered base64-encoded (POST binding, no DEFLATE) in the `SAMLResponse` form field.

```xml
<samlp:Response
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_synthetic-resp-000000000000000000000001"
    Version="2.0"
    IssueInstant="2026-07-25T15:04:10Z"
    Destination="https://sp.example.com/saml/acs"
    InResponseTo="_synthetic-req-0000000000000000000000001">
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
            Recipient="https://sp.example.com/saml/acs"
            InResponseTo="_synthetic-req-0000000000000000000000001"/>
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
- **`InResponseTo`** — echoes the `AuthnRequest/@ID`; the SP matches it against its pending-request cache to reject injected/unsolicited responses.
- **`Status/StatusCode`** — `...:status:Success` gates acceptance; `Responder`/`AuthnFailed` mean reject.
- **`Signature`** — XML-DSig over the Response and/or Assertion (placeholder here); verify with the IdP cert from metadata **before** reading content, and guard against XML Signature Wrapping.
- **`Subject/NameID`** — the federated user identifier (synthetic persistent id).
- **`SubjectConfirmationData`** — `Recipient` (= ACS URL), `NotOnOrAfter` (short bearer window), and `InResponseTo`.
- **`Conditions`** with **`AudienceRestriction/Audience`** — must name this SP's entityID; `NotBefore`/`NotOnOrAfter` bound validity (allow small clock skew).
- **`AuthnStatement`** — `AuthnInstant`, `SessionIndex` (needed later for Single Logout), and the `AuthnContextClassRef` actually met.
- **`AttributeStatement`** — released user attributes (synthetic mail/cn).
