# SP-Initiated Web Browser SSO

**Status:** ✅ Current

## Purpose

The canonical SAML 2.0 Web Browser SSO flow. The user starts at the Service Provider
(SP); the SP sends an `AuthnRequest` to the Identity Provider (IdP) via the
**HTTP-Redirect binding**, the IdP authenticates the user (or reuses an existing IdP
session), and returns a signed `Response` containing an `Assertion` to the SP's
**Assertion Consumer Service (ACS) URL** via the **HTTP-POST binding**. `RelayState`
carries the deep link the user originally requested so the SP can restore it after SSO.

## When it's used

- Enterprise web apps federated to a corporate IdP (Okta, Entra ID, ADFS, ForgeRock, Shibboleth).
- Any time the user's journey begins at the application, which is the common and
  recommended pattern (the SP controls `InResponseTo` correlation, unlike
  [IdP-initiated SSO](../idp-initiated-sso/README.md)).

## Actors

| Actor | Role |
|---|---|
| User | Human requesting a protected SP resource |
| Browser | User agent relaying front-channel messages |
| SP | Service Provider; issues `AuthnRequest`, validates `Response` at the ACS URL |
| IdP | Identity Provider; authenticates the user at its SSO endpoint, issues the `Assertion` |

## Key protocol details

- `AuthnRequest` is DEFLATE-compressed, base64- and URL-encoded into the `SAMLRequest`
  query parameter of the redirect to the IdP SSO endpoint (HTTP-Redirect binding).
- `RelayState` (max 80 bytes per spec) round-trips opaquely; the SP typically stores the
  original URL server-side and passes a reference.
- The `Response` is delivered as a base64 `SAMLResponse` form field auto-posted to the ACS URL.
- SP validation: XML signature (on Response and/or Assertion), `Issuer`, `Destination`,
  `Audience` restriction, `NotBefore`/`NotOnOrAfter` conditions,
  `SubjectConfirmationData` (`Recipient`, `InResponseTo`, `NotOnOrAfter`), assertion
  replay (one-time-use of assertion ID), and status code `urn:oasis:names:tc:SAML:2.0:status:Success`.

## Alternates covered

- Existing IdP session — seamless SSO with no credential prompt.
- Authentication failure at the IdP (status `Responder` / `AuthnFailed`).
- Invalid or expired assertion rejected by the SP.
- `ForceAuthn="true"` — SP demands fresh authentication even with a live IdP session.
- Signed `AuthnRequest` — IdP verifies the SP's request signature (required by some IdPs).

## Security notes

- Always validate `InResponseTo` against a pending request ID to stop unsolicited /
  attacker-injected responses; reject responses whose ID was never issued or already consumed.
- Enforce one-time use of assertion IDs within the validity window (replay cache).
- Validate the signature **before** trusting any content; use the IdP certificate from
  metadata, never a certificate embedded in the message alone.
- Guard against XML Signature Wrapping (XSW): validate against a strict schema and only
  consume the signed element the signature actually covers.
- `RelayState` must be treated as untrusted input — validate it as a relative/allow-listed
  URL to prevent open redirects.
- Clock skew tolerance for `NotBefore`/`NotOnOrAfter` should be small (2–5 minutes).

## Diagrams

- [sequence.md](sequence.md) — full message exchange with alt blocks
- [swimlane.md](swimlane.md) — lanes for User, Browser, SP, IdP
- [flowchart.md](flowchart.md) — SP-side validation decisions and error terminals

## Related diagrams

- [IdP-initiated SSO](../idp-initiated-sso/README.md) — unsolicited variant, no `InResponseTo`
- [HTTP-Artifact binding](../artifact-binding/README.md) — assertion delivered by reference instead of by value
- [SP-initiated Single Logout](../slo-sp-initiated/README.md) — ending the sessions created here
- [ECP profile](../ecp/README.md) — the non-browser equivalent of this flow
- [OIDC Authorization Code](../../oidc/authorization-code/README.md) — the OIDC counterpart
- [Session cookie authentication](../../tokenless/session-cookie/README.md) — the SP session after SSO
