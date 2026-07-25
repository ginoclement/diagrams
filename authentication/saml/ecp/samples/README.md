---
title: "Enhanced Client or Proxy (ECP) Profile — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Enhanced Client or Proxy (ECP) Profile — Sample Capture

> **Fully synthetic and sanitized.** Every ID, timestamp, NameID, host, certificate, and signature below is a placeholder. Nothing here is a real assertion, key, or person.

- HAR capture: [`ecp.har`](./ecp.har) — HTTP-level view of the exchange (load it into the browser Network tab or a HAR viewer).

The base64 blobs in the HAR decode (conceptually) to the annotated XML below.

## SOAP-wrapped `AuthnRequest` (SP → client, PAOS response)

The SP returns this SOAP envelope in the body of the resource response; the SAML message is **inline XML**, not base64/DEFLATE.

```xml
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Header>
    <paos:Request xmlns:paos="urn:liberty:paos:2003-08"
        S:mustUnderstand="1" S:actor="http://schemas.xmlsoap.org/soap/actor/next"
        responseConsumerURL="https://sp.example.com/saml/acs"
        service="urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"/>
    <ecp:Request xmlns:ecp="urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        S:mustUnderstand="1" S:actor="http://schemas.xmlsoap.org/soap/actor/next"
        IsPassive="0">
      <saml:Issuer>https://sp.example.com/saml/metadata</saml:Issuer>
    </ecp:Request>
    <ecp:RelayState xmlns:ecp="urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"
        S:mustUnderstand="1" S:actor="http://schemas.xmlsoap.org/soap/actor/next">
      cmVsYXlzdGF0ZS1zeW50aGV0aWMtL2FwcC9kYXNoYm9hcmQ
    </ecp:RelayState>
  </S:Header>
  <S:Body>
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
  </S:Body>
</S:Envelope>
```

Annotated key elements:

- **`paos:Request/@responseConsumerURL`** — where the SP expects the final `Response`; the client MUST compare it to the IdP's `AssertionConsumerServiceURL` (below).
- **`ecp:Request/saml:Issuer`** — the SP entityID; `IsPassive` says whether the IdP may prompt.
- **`ecp:RelayState`** — a SOAP header block (not a query param); the client echoes it to the IdP and back to the SP.
- **`S:Body/AuthnRequest`** — the same `AuthnRequest` as the browser profiles, just transported inline over SOAP.

## SOAP-wrapped `Response` (IdP → client)

The IdP replies with an `ecp:Response` header (carrying the ACS URL to compare) and the signed SAML `Response` in the body.

```xml
<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">
  <S:Header>
    <ecp:Response xmlns:ecp="urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"
        xmlns:S2="http://schemas.xmlsoap.org/soap/envelope/"
        S2:mustUnderstand="1" S2:actor="http://schemas.xmlsoap.org/soap/actor/next"
        AssertionConsumerServiceURL="https://sp.example.com/saml/acs"/>
  </S:Header>
  <S:Body>
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
  </S:Body>
</S:Envelope>
```

Annotated key elements:

- **`ecp:Response/@AssertionConsumerServiceURL`** — MUST equal the SP's `responseConsumerURL`; on mismatch the client sends a SOAP fault and aborts (the profile's core MITM defense).
- **`Response` / `Assertion`** — validated exactly as in the browser profile: `Issuer`, `Status`, `Signature`, `Subject/NameID`, `Conditions`/`Audience`, `AuthnStatement`.
- The client then POSTs this `Response` to the ACS as `application/vnd.paos+xml`, replaying `ecp:RelayState`.
