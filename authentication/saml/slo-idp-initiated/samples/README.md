---
title: "Single Logout — IdP-Initiated — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Single Logout — IdP-Initiated — Sample Capture

> **Fully synthetic and sanitized.** Every ID, timestamp, NameID, host, certificate, and signature below is a placeholder. Nothing here is a real assertion, key, or person.

- HAR capture: [`slo-idp-initiated.har`](./slo-idp-initiated.har) — HTTP-level view of the exchange (load it into the browser Network tab or a HAR viewer).

The base64 blobs in the HAR decode (conceptually) to the annotated XML below.

## Decoded `LogoutRequest`

Sent DEFLATE+base64+URL-encoded in the `SAMLRequest` query parameter (Redirect binding), signed.

```xml
<samlp:LogoutRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_synthetic-lor-00000000000000000000000001"
    Version="2.0"
    IssueInstant="2026-07-25T16:00:00Z"
    Destination="https://idp.example.net/slo/redirect">
  <saml:Issuer>https://sp.example.com/saml/metadata</saml:Issuer>
  <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">
    S-1-5-21-SYNTHETIC-USER-abc123
  </saml:NameID>
  <samlp:SessionIndex>_synthetic-session-0000000000001</samlp:SessionIndex>
</samlp:LogoutRequest>
```

Annotated key elements:

- **`Issuer`** — who is asking for logout (the initiating SP for SP-initiated; the IdP for IdP-initiated fan-out).
- **`Destination`** — the SLO endpoint the request is bound to.
- **`NameID`** — identifies whose session to terminate; must match an existing session.
- **`SessionIndex`** — the specific `AuthnStatement/@SessionIndex` issued during SSO, so exactly the right session is killed.
- **`ID`** — correlates with **`InResponseTo`** on the matching `LogoutResponse`.
- **Signature** (not shown inline; carried as the Redirect `Signature`/`SigAlg` params) — mandatory; an unsigned `LogoutRequest` is a forced-logout/CSRF primitive.

## Decoded `LogoutResponse`

The reply confirming the session was terminated.

```xml
<samlp:LogoutResponse
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="_synthetic-lores-0000000000000000000001"
    Version="2.0"
    IssueInstant="2026-07-25T16:00:05Z"
    Destination="https://sp.example.com/saml/slo"
    InResponseTo="_synthetic-lor-00000000000000000000000001">
  <saml:Issuer>https://idp.example.net/saml/metadata</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
</samlp:LogoutResponse>
```

Annotated key elements:

- **`Issuer`** — the responder (IdP replying to the initiating SP, or an SP replying to the IdP).
- **`Destination`** — where the response is bound.
- **`InResponseTo`** — echoes the `LogoutRequest/@ID`.
- **`Status/StatusCode`** — `...:status:Success` for a clean logout; a top-level `Success` with a second-level `...:status:PartialLogout` means at least one participant could not be logged out.
