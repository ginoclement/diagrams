---
title: "IP Allowlist / Network-Location Authentication"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IP Allowlist / Network-Location Authentication

**Status:** ✅ Current

Access decisions based on **where the request comes from** rather than who is making
it: source-IP allowlists, "must be on the VPN," "only reachable from the office
range," or private-network reachability treated as implicit authentication. There is
no credential and no token — the network location *is* the proof. This is the
weakest pattern in this category and is included largely so its limitations can be
diagrammed; it survives as a **secondary control** layered under real authentication.

## When it's used

- Restricting admin panels, databases, and internal APIs to office/VPN egress IPs.
- Partner/B2B integrations pinned to the partner's published egress addresses.
- Cloud security groups and firewall rules gating who can even complete a TCP
  handshake.
- As a **conditional-access signal**: "on-network" users skip MFA, off-network users
  get stepped up (the combined flow diagrammed here).

## Actors

| Actor | Role |
|---|---|
| User | Human (or service) originating traffic |
| Client | Device / workstation whose network path determines the source IP |
| VPN | VPN concentrator / private network providing the trusted address space |
| Gateway | Firewall / load balancer / app gateway evaluating the allowlist |
| App | Application behind the gateway |
| IdP | Secondary authentication when network location alone is not enough |

## Alternate scenarios covered

- **Request from a disallowed IP** — dropped or rejected at the gateway; ideally the
  service is not even discoverable.
- **Allowlisted but unauthenticated** — network check passes but the app still
  requires login (allowlist as a filter, not as authentication) — the recommended
  combination.

## Security notes

- **An IP address is not an identity.** Everything behind a shared NAT, VPN
  concentrator, or office network looks identical; one compromised device on the
  trusted network inherits the access of everyone else. This is exactly the
  "castle-and-moat" model that
  [zero-trust network access](../../../infrastructure/architecture/zero-trust-architecture/README.md)
  replaces: authenticate the **user and device on every request**, not the network.
- Source IPs can be misleading: `X-Forwarded-For` is client-controlled unless set by
  your own edge; only trust the transport-level peer address or a header set by an
  infrastructure hop you own.
- Cloud egress IPs are shared and recycled; allowlisting a cloud provider range often
  allowlists strangers.
- IP spoofing is impractical for established TCP/TLS sessions but trivial for UDP and
  for log/trust decisions made on unauthenticated single packets.
- Best practice: keep allowlists as **defense-in-depth** (reduce attack surface,
  cut scanning noise) but always pair them with real authentication —
  see the combined flow in the diagrams.

## Diagrams

- [sequence.md](./sequence.md) — network check then app access; disallowed IP; allowlist + secondary auth.
- [swimlane.md](./swimlane.md) — lanes for User/Client, VPN, Gateway, App, IdP.
- [flowchart.md](./flowchart.md) — decision logic: peer address trust, allowlist match, step-up auth.

## Related diagrams

- [Zero-trust network access](../../../infrastructure/architecture/zero-trust-architecture/README.md) — the successor model; why location-based trust fails.
- [Defense in depth](../../../infrastructure/network-security/defense-in-depth-firewall/README.md) — the legitimate role of allowlists as one layer.
- [header-based-sso](../header-based-sso/README.md) — another pattern that leans on network reachability as its trust boundary.
- [mutual-tls](../mutual-tls/README.md) — cryptographic machine identity instead of address-based identity.
