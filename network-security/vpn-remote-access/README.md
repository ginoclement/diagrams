# Remote Access VPN

How a remote user's device gets an authenticated, encrypted tunnel into a private
network. The client connects to a **VPN gateway**, authenticates (commonly
**IKEv2/IPsec** or a **TLS/SSL VPN**) with **MFA**, the gateway runs an **endpoint
posture / health check** (disk encryption, patch level, EDR present), and only then is a
tunnel established and internal routes pushed. The tunnel can be **split** (only
corporate subnets routed through it) or **full** (all traffic), and access to internal
resources still passes through the usual firewalls and segmentation.

## What it shows

- The remote-access negotiation: gateway discovery, user (and optionally device)
  authentication, MFA, posture assessment, and tunnel establishment.
- **IKEv2/IPsec** phases (IKE_SA_INIT key agreement, then IKE_AUTH) versus a
  **TLS/SSL VPN** handshake, as two authentication styles behind the same flow.
- **Split-tunnel vs full-tunnel** routing and what each means for traffic and inspection.
- Where the tunnel lands (a VPN concentrator inside the perimeter) and how internal
  firewalls still gate what the tunneled client can reach.

## Actors / components

| Component | Role |
|---|---|
| VPN client | Software on the endpoint; negotiates the tunnel, applies pushed routes |
| Endpoint / posture agent | Reports device health (disk encryption, patches, EDR) |
| VPN gateway / concentrator | Terminates the tunnel; enforces auth + posture |
| IdP / MFA | Authenticates the user and the second factor (RADIUS/SAML/OIDC) |
| Internal resources | App/data behind the gateway, still gated by internal firewalls |

## Alternate scenarios covered

- **Posture check fails** — device is non-compliant (no EDR, unpatched, encryption off);
  the client is placed in a **quarantine / remediation** VLAN with access only to
  patch/remediation services until it passes.
- **Certificate vs credential auth** — machine/user **certificate** authentication
  (often for always-on device tunnels) versus username/password + MFA.
- **Always-on vs on-demand** — an always-on tunnel comes up automatically whenever the
  device is off the trusted network, versus a user-initiated on-demand connection.

## Security notes

- **MFA is table stakes.** Credential-only VPN is a top ransomware entry point; require
  a phishing-resistant second factor, and prefer certificate + MFA for high assurance.
- **Posture assessment is point-in-time.** A device can pass at connect and drift out of
  compliance; combine with continuous checks and short re-auth intervals rather than
  trusting the connect-time verdict indefinitely.
- **Full tunnel gives you inspection; split tunnel gives you performance.** Full tunnel
  routes all traffic through corporate egress (DLP/IPS see it) at a bandwidth cost;
  split tunnel is faster but leaves personal traffic uninspected and can be abused to
  bridge networks. Choose deliberately and lock the route list.
- **A VPN grants network position, not application trust.** Once tunneled, the client is
  "inside" — segment internal resources so a compromised VPN endpoint cannot roam. This
  is exactly the flat-network risk **ZTNA** addresses by brokering per-application access
  instead of a network tunnel.
- Protect the gateway itself: patch it promptly (VPN appliances are heavily targeted),
  rate-limit and lock out auth attempts, and terminate the tunnel in a controlled zone,
  not straight onto the flat internal LAN.

## Related diagrams

- [Network segmentation and the DMZ](../network-segmentation-dmz/README.md) — what the tunneled client can and cannot reach once inside.
- [IP allowlist / network-location authentication](../../tokenless/ip-allowlist-network-auth/README.md) — the "on the network = trusted" assumption VPNs create.
- [Zero-trust architecture](../../architecture/zero-trust-architecture/README.md) — ZTNA as the per-application alternative to a network tunnel.
- [TLS 1.3 handshake](../tls-handshake/README.md) — the handshake underlying TLS/SSL VPNs.

## Files

- [sequence.md](sequence.md) — gateway auth, MFA, posture, and tunnel setup, with posture-fail and cert-auth alts.
- [swimlane.md](swimlane.md) — Client / Gateway / IdP-MFA / Internal-resources zones, split vs full tunnel.
- [flowchart.md](flowchart.md) — connect decision: auth, MFA, posture pass/fail, tunnel mode, quarantine terminal.
