# SPNEGO over HTTP (HTTP Negotiate)

**Status:** ✅ Current

## Purpose

SPNEGO (Simple and Protected GSS-API Negotiation) lets a browser perform
Kerberos single sign-on to a web server over HTTP. The server challenges with
`401 WWW-Authenticate: Negotiate`; the browser obtains a Kerberos service
ticket for the site's SPN (`HTTP/host`), wraps the **AP-REQ** in a SPNEGO
token, and returns it in `Authorization: Negotiate <base64>`. It is the HTTP
transport for the [AP Exchange](../ap-exchange/README.md).

## When it is used

- Intranet web apps with Windows Integrated Authentication (IIS, Apache
  `mod_auth_gssapi`, nginx, Tomcat/Spring `SpnegoAuthenticationProcessingFilter`).
- Desktop browsers on a domain-joined host where the site is in the trusted
  intranet zone; provides seamless (no prompt) SSO.

## Actors

| Actor | Role |
|---|---|
| `User` | Human at the browser |
| `Browser` | User agent performing the Negotiate handshake |
| `TGS` | KDC ticket-granting service (issues the HTTP service ticket) |
| `Service` | Web server that owns SPN `HTTP/host` |

## Key message contents

- Server challenge: `HTTP/1.1 401` with `WWW-Authenticate: Negotiate`.
- Client response: `Authorization: Negotiate YII...` — a SPNEGO
  `NegTokenInit` carrying `mechType=Kerberos` and the wrapped AP-REQ.
- Server success: `200 OK`, optionally `WWW-Authenticate: Negotiate <AP-REP>`
  for mutual auth; the authenticated session is then held via a cookie /
  keep-alive connection.

## Alternate / error scenarios

- **NTLM fallback** — if Kerberos is unavailable (no TGT, SPN unresolved), the
  browser may negotiate **NTLM inside SPNEGO** (`NegTokenInit` advertises the
  NTLMSSP mech), yielding a challenge/response round trip instead.
- **SPN mismatch / not in trusted sites** — site not in the intranet zone, or
  the URL host does not match the registered SPN: browser sends no Negotiate
  header (falls to Basic/Forms) or Kerberos fails with
  `S_PRINCIPAL_UNKNOWN` and NTLM is tried.
- **No TGT** — user not logged into the domain: the OS may prompt for
  credentials, or authentication fails.

## Security notes

- Prefer Kerberos over NTLM; disable NTLM fallback where possible (NTLM is
  relay- and crack-prone).
- Register SPNs against a **single** account (gMSA) to avoid duplicate-SPN
  Kerberos failures that silently downgrade to NTLM.
- Use HTTPS with **channel binding** (EPA) so an AP-REQ cannot be relayed to a
  different endpoint.
- This is closely related to other browser SSO mechanisms — see
  [Header-Based SSO](../../tokenless/header-based-sso/README.md).

## Diagrams

- [Sequence diagram](sequence.md)
- [Swimlane diagram](swimlane.md)
- [Flowchart (decision logic)](flowchart.md)

## Related diagrams

- [AP Exchange](../ap-exchange/README.md) — the Kerberos exchange SPNEGO carries.
- [TGS Exchange](../tgs-exchange/README.md) — where the browser gets the HTTP service ticket.
- [Header-Based SSO](../../tokenless/header-based-sso/README.md) — alternative reverse-proxy browser SSO.
