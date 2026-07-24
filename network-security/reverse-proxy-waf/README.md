# Reverse Proxy and Web Application Firewall

A reverse proxy sits in front of an application and is the single, hardened ingress for
all client traffic. It **terminates TLS**, runs the request through a **Web Application
Firewall** (WAF) that inspects it against an attack ruleset (typically the **OWASP Core
Rule Set**), applies **rate limiting** and bot challenges, then **routes** the request to
an origin server — often **re-encrypting** to the origin. On the way through it can
**inject identity headers** for the downstream app (the request has already been
authenticated at the edge). This is the DMZ ingress component referenced by the
segmentation diagram.

## What it shows

- The edge request path: TLS termination, WAF inspection, rate limiting, routing, and
  the response back to the client.
- **WAF inspection** against the OWASP CRS (SQLi, XSS, path traversal, RCE, protocol
  anomalies) and the block-vs-pass decision.
- **Header injection for downstream identity** — the proxy authenticates the caller and
  passes a trusted identity header (e.g. `X-Forwarded-User`) to the origin.
- **TLS re-encryption to the origin** so traffic is not plaintext on the internal hop.

## Actors / components

| Component | Role |
|---|---|
| Client | Browser / API caller sending HTTPS requests |
| Reverse proxy | TLS termination, routing, header handling, single ingress |
| WAF | Inspects requests against the OWASP CRS; blocks or passes |
| Rate limiter / bot manager | Throttles abusive volume; challenges suspected bots |
| Origin / app server | Backend that receives the (re-encrypted) proxied request |

## Alternate scenarios covered

- **WAF blocks a malicious request** — a payload matches a CRS rule (or exceeds the
  anomaly score); the proxy returns 403 and never forwards to the origin.
- **TLS re-encryption to origin** — the proxy terminates the client TLS session and
  opens a *separate* TLS session to the origin (end-to-end encryption, not plaintext
  backhaul), optionally with mTLS to the origin.
- **Bot / rate-limit challenge** — traffic over a threshold, or scoring as automated,
  gets a 429 or an interactive challenge (JS/CAPTCHA) before being allowed through.

## Security notes

- **The proxy is a trust boundary, and the origin must enforce it.** Injected identity
  headers are only trustworthy if the origin accepts them **exclusively** from the proxy
  and the proxy **strips any client-supplied copy** of those headers. A client that can
  reach the origin directly and set `X-Forwarded-User` bypasses all authentication — the
  same trust-boundary problem as header-based SSO.
- **WAF is defense in depth, not a fix.** It reduces exposure to known attack classes but
  is bypassable (encoding tricks, novel payloads); keep the app patched and validate
  input at the source. Run CRS in blocking mode with a tuned anomaly threshold to balance
  false positives.
- **Terminating TLS means the proxy sees plaintext.** Protect its key material and logs,
  and re-encrypt to the origin so the internal hop is not cleartext; use mTLS to the
  origin where possible so only the proxy can talk to it.
- **Rate limiting protects availability and slows credential stuffing / scraping.** Apply
  per-IP and per-account limits, and prefer challenges over hard blocks for ambiguous
  bot traffic to avoid locking out real users.
- Add security response headers (HSTS, CSP, `X-Content-Type-Options`) at the edge, and
  normalize/canonicalize the request before inspection so evasion via double-encoding is
  harder.

## Related diagrams

- [Header-based SSO (proxy-injected identity)](../../tokenless/header-based-sso/README.md) — the proxy-to-origin identity trust boundary in full.
- [Network segmentation and the DMZ](../network-segmentation-dmz/README.md) — where this proxy sits as DMZ ingress.
- [TLS 1.3 handshake](../tls-handshake/README.md) — the handshake terminated (and re-originated) here.
- [Defense in depth (firewall / IDS / IPS)](../defense-in-depth-firewall/README.md) — the network-layer inspection complementing the WAF's app-layer inspection.
- [API gateway authn/authz](../../architecture/api-gateway-authn-authz/README.md) — the API-focused sibling of edge inspection and identity injection.

## Files

- [sequence.md](sequence.md) — request path through TLS termination, WAF, rate limit, origin, with block and challenge alts.
- [swimlane.md](swimlane.md) — Client / DMZ proxy+WAF / Internal origin zones and the re-encrypted hop.
- [flowchart.md](flowchart.md) — edge evaluation: TLS, rate limit, WAF verdict, route or block.
