---
title: "Enhanced Client or Proxy (ECP) Profile — Reading it in DevTools"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---


# Enhanced Client or Proxy (ECP) Profile — Reading it in DevTools

**ECP is a non-browser profile**, so there is nothing to watch in the browser DevTools Network tab — the exchange happens over SOAP from a CLI/desktop client or proxy. Capture it with `curl -v`, `mitmproxy`, or Wireshark instead. The steps below map to the sample capture in [`samples/`](./samples/README.md).

1. **SP resource request (PAOS advertised).** `GET https://sp.example.com/protected/resource`
   with `Accept: application/vnd.paos+xml` and the `PAOS:` header. In `curl -v` look at the
   response body: a SOAP envelope containing `paos:Request` (note its **`responseConsumerURL`**),
   `ecp:Request`, `ecp:RelayState`, and the `samlp:AuthnRequest`. The `AuthnRequest` here is
   **inline XML**, not base64/DEFLATE — read it directly.
2. **IdP SOAP SSO POST.** The client POSTs the wrapped `AuthnRequest` to
   `https://idp.example.net/idp/profile/SAML2/SOAP/ECP` with direct auth (HTTP Basic here). A `401`
   means the credentials failed; on success the SOAP response carries `ecp:Response` with
   **`AssertionConsumerServiceURL`** plus the signed `samlp:Response`.
3. **ACS PAOS POST.** The client POSTs the SOAP-wrapped `Response` to `https://sp.example.com/saml/acs` with
   `Content-Type: application/vnd.paos+xml`, replaying **`ecp:RelayState`**. Before sending,
   confirm `responseConsumerURL` (step 1) equals `AssertionConsumerServiceURL` (step 2); a
   mismatch means you send a SOAP fault and abort.

## RelayState

`ecp:RelayState` is a SOAP header block (not a query/form field). The client must echo the
exact value it received from the SP back to the IdP and then to the SP.

## Readable XML

Pretty-print the SOAP bodies with `xmllint --format` or an editor's XML formatter. The
**SAML Tracer** / **Auth Inspector** browser extensions don't apply here since no browser is
involved; for the SAML message inside the envelope you can still paste the `samlp:Response`
into any SAML decoder.
