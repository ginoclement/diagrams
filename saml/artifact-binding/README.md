# HTTP-Artifact Binding

**Status:** ✅ Current

## Purpose

Delivery of SAML messages **by reference** instead of by value. Rather than pushing the
full (potentially large, sensitive) `Response` through the browser, the IdP redirects
the browser to the SP carrying only a small opaque **artifact** (`SAMLart` parameter).
The SP then dereferences it over a mutually authenticated **back-channel SOAP** call —
`ArtifactResolve` to the IdP's **Artifact Resolution Service (ARS)**, answered by an
`ArtifactResponse` that contains the actual `Response` and `Assertion`.

## When it's used

- Deployments that must keep assertions off the front channel (browser history, proxy
  logs, referrer leakage) for confidentiality or size reasons.
- Environments with strict URL-length limits where a POSTed response is undesirable.
- Higher-assurance federations (government/education, e.g. some Shibboleth/eduGAIN
  profiles) that want the SP-to-IdP TLS back channel as an extra authentication factor.

## Actors

| Actor | Role |
|---|---|
| User | Human requesting the SP resource |
| Browser | Carries only the artifact, never the assertion |
| SP | Sends `AuthnRequest`; dereferences the artifact at the ARS |
| IdP | Issues artifact; its Artifact Resolution Service answers `ArtifactResolve` |

## Key protocol details

- The artifact is a 44-byte structure: `TypeCode` (0x0004), `EndpointIndex`,
  `SourceID` (SHA-1 of the issuer's entityID), and a 20-byte random `MessageHandle`.
  It is a one-time-use reference to a message stored at the IdP.
- Front channel: `302 Redirect` to the SP's ACS URL with `SAMLart` + `RelayState`.
- Back channel: signed SOAP `ArtifactResolve` (containing the artifact) to the ARS
  endpoint over mutually authenticated TLS; `ArtifactResponse` wraps the original
  `Response`. The IdP **deletes the artifact on first resolution**.
- The SP then validates the embedded `Response`/`Assertion` exactly as in
  [SP-initiated SSO](../sp-initiated-sso/README.md) (signature, audience, conditions,
  `InResponseTo`).
- Artifacts have a short TTL (typically a few minutes at most; often much shorter).

## Alternates covered

- Artifact expired before resolution (slow user/network) — ARS returns no message.
- Artifact already dereferenced (replay of the `SAMLart` URL) — one-time-use enforced.

## Security notes

- One-time use plus short TTL makes a stolen artifact URL nearly useless — but only if
  the ARS truly deletes on first resolve and the SP rejects empty `ArtifactResponse`s.
- The ARS must authenticate the caller (mutual TLS or signed `ArtifactResolve`) and
  check the artifact was **issued for that SP**; otherwise any federation member could
  steal assertions by resolving found artifacts.
- The back channel adds an outbound-connectivity requirement from SP to IdP —
  firewalls and proxies must permit it, and its failure mode must be handled.
- Assertion validation is *not* skipped just because the back channel is trusted —
  signature, conditions, and `InResponseTo` checks still apply.

## Diagrams

- [sequence.md](sequence.md) — artifact issuance, SOAP resolution, expiry/replay alternates
- [swimlane.md](swimlane.md) — lanes for User, Browser, SP, IdP (front vs back channel visible)
- [flowchart.md](flowchart.md) — ARS decision logic and SP-side handling of resolution failures

## Related diagrams

- [SP-initiated SSO](../sp-initiated-sso/README.md) — same profile with HTTP-POST delivery
- [ECP profile](../ecp/README.md) — another SOAP-based SAML exchange, for non-browser clients
- [OIDC Authorization Code](../../oidc/authorization-code/README.md) — conceptually similar: opaque code by front channel, dereferenced on the back channel
- [Mutual TLS](../../tokenless/mutual-tls/README.md) — the usual authentication for the SP-to-ARS call
