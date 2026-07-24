# Network Security Diagrams

Transport, segmentation, perimeter, and service-to-service controls — the network-layer
side of security and identity. Where [saml/](../saml/), [oidc/](../oidc/), and
[kerberos/](../kerberos/) establish *who* a caller is, these diagrams cover *how traffic
is protected in transit and which flows are allowed across trust boundaries*: the TLS
handshake that encrypts a connection, mutual-TLS identity between services in a mesh,
tiered segmentation and the DMZ, remote-access VPNs, edge reverse proxies with a WAF, and
layered firewall / IDS-IPS / EDR defenses. Together they show both the classic perimeter
model and its evolution toward identity-centric, zero-trust and micro-segmented networks.

## Diagrams

- [tls-handshake](tls-handshake/README.md) — TLS 1.3 full handshake (ClientHello/ServerHello key share, EncryptedExtensions, Certificate, CertificateVerify, Finished, app data), how it differs from TLS 1.2, plus HelloRetryRequest, PSK/ticket resumption, 0-RTT early data and its replay risk, and client-cert request.
- [mtls-service-mesh](mtls-service-mesh/README.md) — service-to-service mTLS in a mesh: sidecar proxies, SPIFFE/SVID identities, a control plane issuing short-lived certs, workload attestation, authorization policy, cert rotation, and permissive-to-strict migration.
- [network-segmentation-dmz](network-segmentation-dmz/README.md) — tiered segmentation from Internet to edge firewall to DMZ to internal firewall to app tier to data tier; north-south vs east-west, allowed flows, blocked lateral movement, jump-host access, and micro-segmentation.
- [vpn-remote-access](vpn-remote-access/README.md) — remote-access VPN: gateway auth (IKEv2/IPsec or TLS/SSL VPN), MFA, endpoint posture/health check, tunnel establishment, split vs full tunnel, posture-fail quarantine, and certificate vs credential auth.
- [reverse-proxy-waf](reverse-proxy-waf/README.md) — reverse proxy + Web Application Firewall: TLS termination, OWASP CRS inspection, rate limiting and bot challenges, routing with TLS re-encryption to origin, and downstream identity-header injection.
- [defense-in-depth-firewall](defense-in-depth-firewall/README.md) — layered perimeter and host defenses: stateful firewall, IDS/IPS, proxy, host firewall, and EDR evaluating a connection in turn, with IPS drop/reset, allowed-flow logging, and egress filtering blocking C2.

## Related categories

- [tokenless/](../tokenless/) — [mutual-tls](../tokenless/mutual-tls/README.md), [header-based-sso](../tokenless/header-based-sso/README.md), and [ip-allowlist-network-auth](../tokenless/ip-allowlist-network-auth/README.md) connect directly to these transport and perimeter controls.
- [architecture/](../architecture/) — [zero-trust-architecture](../architecture/zero-trust-architecture/README.md), [api-gateway-authn-authz](../architecture/api-gateway-authn-authz/README.md), and [pki-hierarchy](../architecture/pki-hierarchy/README.md) put these network controls in a broader design context.
- [oidc/](../oidc/) and [saml/](../saml/) — the federated identity layered on top of the secured transport shown here.
