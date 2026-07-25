---
title: "IP Allowlist / Network-Location Authentication — Sample Capture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IP Allowlist / Network-Location Authentication — Sample Capture

A sanitized HAR of the same request on-network and off-network, plus a spoofed
`X-Forwarded-For` attempt. **All values are synthetic** and use the reserved
documentation address ranges (RFC 5737).

- Capture: [ip-allowlist-network-auth.har](./ip-allowlist-network-auth.har) (HAR 1.2)

## The three entries

| # | Source IP | Extra | Decision | Status |
|---|---|---|---|---|
| 1 | `203.0.113.7` (allowlisted) | — | ALLOW | `200` |
| 2 | `198.51.100.23` (off-net) | — | DENY | `403` |
| 3 | `198.51.100.23` (off-net) | forged `X-Forwarded-For: 203.0.113.5` | DENY | `403` |

## The defining artifact: no credential at all

Inspect any request in the HAR — there is **no `Authorization` header, no auth
cookie, and no token**. Nothing identifies the caller. The only difference between
the `200` and the `403` is the **source IP**, which is evaluated at the gateway and is
**not part of the HTTP request** — it is documented here in the non-standard
`_networkContext` extension field on each entry (browsers do not expose this).

## Decoded network context

| Entry | `_networkContext.clientSourceIp` | Allowlist | Decision |
|---|---|---|---|
| 1 | `203.0.113.7` | `203.0.113.0/24` | ALLOW — peer inside range |
| 2 | `198.51.100.23` | `203.0.113.0/24` | DENY — peer outside range |
| 3 | `198.51.100.23` (spoofed header `203.0.113.5`) | `203.0.113.0/24` | DENY — header ignored, real peer used |

## Why entry 3 still fails

`X-Forwarded-For` is **client-controlled**. A correct gateway decides on the
**transport peer address** (or a header set by an infrastructure hop it owns), so the
forged `203.0.113.5` is ignored and the real peer `198.51.100.23` is evaluated →
still denied. If a gateway trusted the client-supplied header, the allowlist would be
trivially bypassable.

## Takeaway

An IP address is not an identity. Everything behind a shared NAT/VPN/office egress
looks identical, and a `200` here proves only *network location*, not *who*. Use the
allowlist as **defense-in-depth** under real authentication — see the combined flow in
the [flow README](../README.md).

---

**Synthetic note:** all addresses use RFC 5737 documentation ranges
(`203.0.113.0/24`, `198.51.100.0/24`). No real IPs, credentials, or PII appear here.
