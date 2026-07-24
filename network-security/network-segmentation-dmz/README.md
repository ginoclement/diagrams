# Network Segmentation and the DMZ

Classic tiered network segmentation: untrusted traffic from the **Internet** crosses an
**edge firewall** into a **DMZ** (demilitarized zone) holding internet-facing services
behind a reverse proxy / WAF, then an **internal firewall** gates the small set of flows
allowed onward to the **app tier**, and a further boundary protects the **data tier**.
The design assumes breach: even if the DMZ is compromised, the internal firewall limits
what the attacker can reach, and **east-west** controls stop lateral movement between
peers on the same tier.

## What it shows

- The layered path Internet to edge firewall to DMZ to internal firewall to app tier
  to data tier, and which flows each boundary permits.
- **North-south** traffic (client to server, crossing tiers/perimeter) versus
  **east-west** traffic (server to server within or across tiers) and why east-west is
  the harder problem.
- **Allowed flows** drawn explicitly (e.g. reverse proxy to app on 443) and **denied
  lateral movement** (e.g. a compromised DMZ host trying to reach the database directly,
  or one app server pivoting to another).

## Actors / components

| Component | Zone | Role |
|---|---|---|
| Client | Internet | External user / attacker; only reaches published DMZ services |
| Edge firewall | Perimeter | First filter; permits only 443/80 to the DMZ |
| Reverse proxy / WAF | DMZ | Terminates TLS, inspects, forwards a narrow set of flows inward |
| Internal firewall | Boundary | Permits only DMZ to app-tier on defined ports; blocks the rest |
| App servers | App tier | Business logic; talk to the data tier, not to each other freely |
| Database | Data tier | Most protected; reachable only from the app tier |
| Jump host / bastion | Management | Brokered admin access into internal tiers |

## Alternate scenarios covered

- **Management / jump-host access** — admins do not connect straight to servers; they
  land on a hardened bastion (MFA, session recording) that is the only source permitted
  to reach management ports on internal hosts.
- **Blocked lateral movement** — a compromised DMZ web host attempts to reach the
  database or another tier directly; the internal firewall / segmentation policy drops
  it because that flow was never allowed.
- **Micro-segmentation** — instead of a few coarse tiers, per-workload identity-based
  policy allows only the exact service-to-service flows needed, shrinking east-west
  blast radius to a single workload.

## Security notes

- **Default deny, allow by exception.** Every boundary should start from "deny all" and
  open only the specific source/destination/port flows the application requires. A DMZ
  host should have *no* route to the data tier.
- **The DMZ is assumed hostile.** Treat DMZ hosts as potentially compromised: no domain
  join into the internal forest, no stored internal credentials, outbound egress
  filtered so a foothold cannot phone home or pivot.
- **East-west is where breaches spread.** Perimeter (north-south) firewalls do nothing
  against an attacker already inside a tier; segment east-west and prefer
  micro-segmentation / identity-based policy for high-value tiers.
- **Data tier is the crown jewels.** Only the app tier should reach it, on specific DB
  ports, ideally with mTLS and per-service accounts; never expose it to the DMZ or
  Internet.
- **Management plane is a separate zone.** Admin access flows through a bastion with MFA
  and logging; flat management access is a common lateral-movement highway.
- Segmentation complements, but does not replace, identity: a zero-trust model checks
  identity on every hop rather than trusting a host because of its network location.

## Related diagrams

- [Reverse proxy + WAF](../reverse-proxy-waf/README.md) — the DMZ ingress component in detail.
- [Defense in depth (firewall / IDS / IPS)](../defense-in-depth-firewall/README.md) — the layered inspection at each boundary.
- [VPN remote access](../vpn-remote-access/README.md) — how remote admins reach the management zone.
- [IP allowlist / network-location authentication](../../tokenless/ip-allowlist-network-auth/README.md) — the network-trust assumption segmentation relies on, and its limits.
- [Zero-trust architecture](../../architecture/zero-trust-architecture/README.md) — the identity-first alternative to perimeter trust.

## Files

- [sequence.md](sequence.md) — a north-south request across the tiers, plus lateral-movement and jump-host alts.
- [swimlane.md](swimlane.md) — zones as subgraphs (Internet / DMZ / App / Data / Management) with allowed and denied flows.
- [flowchart.md](flowchart.md) — per-boundary allow-vs-deny evaluation with explicit drop terminals.
