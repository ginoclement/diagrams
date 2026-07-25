# Enhanced Client or Proxy (ECP) Profile

**Status:** ✅ Current

## Purpose

The SAML 2.0 profile for **non-browser clients** — desktop apps, CLI tools, mail
clients, or gateway proxies — that can speak SOAP but cannot follow interactive
redirects. ECP uses **reverse SOAP (PAOS)**: the SP sends a SOAP-wrapped
`AuthnRequest` *in an HTTP response* to the client; the client forwards it to the IdP
over normal SOAP (authenticating directly, e.g. HTTP Basic), receives a SOAP-wrapped
`Response`, and delivers it back to the SP's ACS in a PAOS HTTP request.

## When it's used

- Shibboleth/eduGAIN environments for non-web apps (classic example: IMAP/desktop
  clients, `curl`-style CLI access to federated resources).
- Reverse proxies or gateways acting on behalf of simple devices ("Proxy" in ECP).
- Anywhere Kerberos is unavailable but non-interactive federated auth is required.

## Actors

| Actor | Role |
|---|---|
| User | Human whose credentials the client holds/prompts for |
| Client | ECP-capable non-browser app or proxy (the "enhanced client") |
| SP | Service Provider; emits `AuthnRequest` in a PAOS response |
| IdP | Identity Provider; ECP SingleSignOnService (SOAP), authenticates the client directly |

## Key protocol details

- Discovery: the client advertises ECP support with request headers
  `Accept: application/vnd.paos+xml` and
  `PAOS: ver="urn:liberty:paos:2003-08"; "urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"`.
- SP reply is a SOAP envelope: `paos:Request` (with `responseConsumerURL`),
  `ecp:Request` (IdP list, `IsPassive`), `ecp:RelayState`, and the `AuthnRequest` body.
- The client — not a browser — chooses the IdP and POSTs the `AuthnRequest` to the
  IdP's ECP **SingleSignOnService (SOAP binding)**, authenticating with HTTP Basic,
  client TLS, or another direct mechanism. No redirects, no cookies, no login pages.
- IdP returns a SOAP envelope: `ecp:Response` header carrying
  `AssertionConsumerServiceURL`, plus the signed SAML `Response`.
- **MITM check**: the client compares the SP's `responseConsumerURL` with the IdP's
  `AssertionConsumerServiceURL`; on mismatch it sends a SOAP fault to the SP and aborts.
- The client finally POSTs the `Response` (content type `application/vnd.paos+xml`,
  restoring `ecp:RelayState`) to the ACS URL and retries the original resource request
  with the SP session it received.

## Alternates covered

- HTTP Basic authentication failure at the IdP (401 / SOAP fault, retry or abort).
- `responseConsumerURL` vs `AssertionConsumerServiceURL` mismatch (SOAP fault to SP).

## Security notes

- The client handles the user's IdP credentials directly — acceptable only for trusted
  first-party clients; this is the same caveat as OAuth2 ROPC. Prefer
  [OIDC device authorization](../../oidc/device-authorization/README.md) or
  [CIBA](../../oidc/ciba/README.md) for third-party or input-constrained clients.
- The URL-comparison step is mandatory — it is the profile's only defense against a
  rogue SP relaying the flow to a different consumer endpoint.
- All legs must be TLS; the assertion transits the client itself, unlike the
  [artifact binding](../artifact-binding/README.md) where the browser never sees it.
- IdPs should rate-limit and MFA-gate ECP endpoints where possible; Basic-auth SOAP
  endpoints are prime password-spray targets.

## Diagrams

- [sequence.md](sequence.md) — full PAOS exchange with basic-auth failure and URL-mismatch alternates
- [swimlane.md](swimlane.md) — lanes for User, Client, SP, IdP
- [flowchart.md](flowchart.md) — client/SP/IdP decision gates and error terminals

## Related diagrams

- [SP-initiated SSO](../sp-initiated-sso/README.md) — the browser profile ECP mirrors
- [HTTP-Artifact binding](../artifact-binding/README.md) — the other SOAP-flavored SAML exchange
- [OIDC client credentials](../../oidc/client-credentials/README.md) / [device authorization](../../oidc/device-authorization/README.md) — modern non-browser alternatives
- [HTTP Basic authentication](../../tokenless/http-basic-auth/README.md) — the client-to-IdP leg shown here
- [Kerberos SPNEGO](../../kerberos/spnego-http/README.md) — the other classic non-interactive enterprise SSO
