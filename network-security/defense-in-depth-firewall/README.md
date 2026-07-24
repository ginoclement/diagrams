# Defense in Depth — Layered Firewall, IDS/IPS, and Host Defenses

No single control catches everything, so a connection is evaluated by **layers**: a
**stateful firewall** at the network edge (5-tuple + connection state), an
**IDS/IPS** inspecting payloads for known-bad signatures and anomalies, a **proxy**
applying application-layer policy, a **host firewall** on the endpoint, and finally
**EDR** watching process/behaviour on the host itself. A packet or connection that looks
clean at one layer can still be dropped, reset, or quarantined at the next — and
outbound **egress filtering** catches command-and-control (C2) that an inbound-focused
perimeter would miss.

## What it shows

- A single connection/packet traversing five defensive layers in order, each with its
  own allow / inspect / deny decision.
- **IDS (detect / alert) vs IPS (inline block / reset)** and where each sits.
- **Egress filtering** as a first-class control: blocking outbound C2 and data
  exfiltration, not just inbound attacks.
- How the layers **log** allowed flows so a later layer's or a hunter's decision has
  context.

## Actors / components

| Component | Layer | Role |
|---|---|---|
| Stateful firewall | Network edge | Allows/denies by 5-tuple + connection state; default deny |
| IDS/IPS | Network inspection | Signature + anomaly inspection; IPS drops/resets inline |
| Proxy | Application | App-layer policy, URL/category filtering, TLS inspection |
| Host firewall | Endpoint | Local port/process rules; last network gate before the app |
| EDR | Endpoint | Behavioural detection on the host; kills/quarantines processes |
| SIEM / log store | Cross-cutting | Receives allow/deny/alert events from every layer |

## Alternate scenarios covered

- **IPS drops / resets a malicious flow** — a payload matches an IPS signature (or scores
  as anomalous); the IPS drops the packets or sends a TCP RST to tear down the connection
  before it reaches the host.
- **Allowed flow is logged** — a clean connection is permitted but still recorded at each
  layer, feeding the SIEM for correlation and later hunting.
- **Egress filtering blocks C2** — an already-compromised host tries to beacon outbound to
  an attacker; egress rules / IPS / proxy category filtering block the destination and
  alert, containing the breach.

## Security notes

- **Layers are independent on purpose.** They fail differently: the firewall doesn't read
  payloads, the IPS can be evaded by encryption, the proxy sees app content, EDR sees host
  behaviour. Depth means a single bypass is not a full compromise.
- **IDS detects, IPS prevents — know which you have.** An IDS in a SPAN/tap only alerts;
  an inline IPS can block but adds latency and, misconfigured, can drop good traffic.
  Tune signatures and run high-confidence rules in block mode, lower-confidence in alert.
- **Egress filtering is undervalued.** Most perimeters obsess over inbound; C2 and
  exfiltration are outbound. Default-deny egress, allow known destinations, and alert on
  new outbound connections — this is often the fastest way to catch a live intrusion.
- **Encryption blinds network inspection.** TLS-everywhere limits what IDS/IPS see;
  compensate with TLS inspection at the proxy (where policy permits) and lean harder on
  **EDR** for host-level visibility.
- **Every layer should log to a central SIEM.** Allowed-flow logs are what let you
  reconstruct an attack; a layer that silently allows without logging is a blind spot.
- Depth is not a substitute for identity and segmentation — pair these controls with the
  segmentation and zero-trust models rather than relying on inspection alone.

## Related diagrams

- [Network segmentation and the DMZ](../network-segmentation-dmz/README.md) — the zones these layers sit between.
- [Reverse proxy + WAF](../reverse-proxy-waf/README.md) — application-layer inspection at the edge, complementing network IPS.
- [VPN remote access](../vpn-remote-access/README.md) — endpoint posture/EDR checks before granting network access.
- [Zero-trust architecture](../../architecture/zero-trust-architecture/README.md) — identity-centric controls layered on top of these network defenses.

## Files

- [sequence.md](sequence.md) — a connection evaluated at each layer, with IPS-drop, logging, and egress-C2-block alts.
- [swimlane.md](swimlane.md) — layers as zones from Internet to host, with allowed, dropped, and egress-blocked flows.
- [flowchart.md](flowchart.md) — per-layer allow/inspect/deny evaluation with explicit drop and reset terminals.
