---
title: "IP Allowlist / Network-Location Authentication — DevTools Walkthrough"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IP Allowlist / Network-Location Authentication — DevTools Walkthrough

How to read IP-allowlist "authentication" in the browser **Network** tab. The
striking thing is what you **do not** see: any credential. All values are
**synthetic**.

## The defining observation: no credential anywhere

Open the request in the **Network** tab and inspect **Request Headers**:

- **No `Authorization` header.**
- **No auth cookie** (no `Cookie: sid=...` establishing identity).
- **No token** in the query string or body.

Nothing in the request identifies *who* is calling. The only thing that decided the
outcome is **where the request came from** — the source IP — which is evaluated at
the gateway, below the application, and is **not** an HTTP artifact you can see in the
request itself.

## Observable requests, in order

1. **On-network `GET /panel` → `200`.** Look at the request: no credential of any
   kind. It succeeded solely because the source IP is in the allowlist.

2. **Off-network `GET /panel` → `403` (or no response at all).** The **exact same
   request** — byte-for-byte identical headers — now fails. In the Network tab you
   see either a `403` row or a failed/`(failed) net::ERR_CONNECTION_TIMED_OUT` row if
   the service is not even reachable off-net. The difference is purely the network
   path, invisible in the request contents.

3. **(Optional) Spoofed `X-Forwarded-For`.** If you add
   `X-Forwarded-For: 10.0.0.5`, a correctly configured gateway **ignores** it and
   still decides on the transport peer address — so the outcome is unchanged. If the
   outcome *does* change, the gateway is dangerously trusting a client-controlled
   header.

## Key takeaway

Because the "credential" is your network location, the Network tab shows an
**unauthenticated-looking request** that nonetheless succeeds or fails depending on
context you cannot see in the request. This is exactly why an IP address is not an
identity, and why the allowlist should be **defense-in-depth** under real
authentication — an authenticated request would additionally carry a `Cookie`,
`Authorization`, or token that you *would* see here.

## What to inspect where

| Signal | Where |
|---|---|
| Absence of any credential | Network → the request row → Request Headers (no Authorization/Cookie/token) |
| On-net success vs off-net failure | Compare the two identical requests' status (`200` vs `403`/failed) |
| `X-Forwarded-For` handling | Add the header and confirm the outcome does **not** change |
| Real auth layered on top | An authenticated variant additionally shows `Cookie`/`Authorization` |

See [samples/README.md](./samples/README.md) for a HAR of the on-net and off-net
requests, highlighting the absent credentials and the `403`.
