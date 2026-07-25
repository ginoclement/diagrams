---
title: "Federation Topology (Identity Broker / Hub-and-Spoke)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Federation Topology (Identity Broker / Hub-and-Spoke)

**Status:** ✅ Current

## What it shows

A hub-and-spoke identity federation: a central **identity broker** (hub) that proxies
authentication between many **upstream IdPs** (enterprise SAML, OIDC, and social logins)
and many **downstream service providers** (relying parties). Instead of every SP
integrating with every IdP (an N x M mesh), each side integrates once with the broker,
turning the problem into N + M. The broker performs **home-realm discovery** (HRD) to
route each user to the right upstream IdP, then normalizes the returned identity into a
single token/assertion the downstream SP understands.

This is the architecture-level counterpart to the individual
[SAML](../../../authentication/saml/sp-initiated-sso/README.md) and [OIDC](../../../authentication/oidc/authorization-code/README.md)
federation flows — it shows how many of them are arranged and brokered at once.

## Actors / components

| Component | Role |
|---|---|
| User | Human authenticating from some home organization |
| Downstream SP / RP | Application that trusts only the broker |
| Identity Broker (Hub) | Central proxy: acts as SP to upstreams and as IdP to downstreams |
| Home-Realm Discovery (HRD) | Determines which upstream IdP a given user belongs to |
| Upstream Enterprise IdP | Corporate IdP federated via SAML or OIDC (Okta, Entra ID, ADFS) |
| Upstream Social IdP | Consumer login provider via OIDC/OAuth (Google, Apple, GitHub) |
| Attribute / Claim Mapper | Normalizes upstream claims into the broker's canonical schema |
| Trust / Metadata Registry | Holds signing certs, metadata, and client registrations for every peer |

## Trust boundaries & security notes

- **The broker is dual-faced:** to upstream IdPs it behaves as a Service Provider /
  relying party; to downstream SPs it behaves as an Identity Provider. Each edge is a
  distinct trust relationship with its own signing keys and metadata.
- **N + M instead of N x M:** every SP trusts one issuer (the broker) and every IdP has
  one relying party (the broker). This is the whole point — but it also makes the broker a
  high-value single point of trust that must be hardened accordingly.
- **Home-realm discovery is a routing, not an authorization, decision.** HRD picks *where*
  to authenticate; it must not leak whether a given email exists at a given realm, and the
  final authorization still depends on the upstream assertion.
- **Claim normalization is a security boundary:** the broker must not blindly pass through
  upstream claims. Map only trusted attributes, strip or rename conflicting ones, and never
  let an upstream assert privileges (e.g. group membership) it is not authoritative for.
- **Transitive trust risk:** a downstream SP inherits trust in every upstream the broker
  accepts. Compromise or misconfiguration of one upstream can affect all downstreams, so
  the trust/metadata registry and per-upstream assurance levels must be tightly governed.
- **Metadata and key rotation** for every peer is managed centrally in the registry;
  expired or rogue certificates are the most common federation outage/attack vector.

## Related diagrams

- [IdP reference architecture](../identity-provider-reference-architecture/README.md) — the internals of one IdP node
- [Zero trust architecture](../zero-trust-architecture/README.md) — consuming brokered identity in policy decisions
- [SAML SP-initiated SSO](../../../authentication/saml/sp-initiated-sso/README.md) — a single upstream/downstream SAML leg
- [OIDC Authorization Code](../../../authentication/oidc/authorization-code/README.md) — a single OIDC leg to a social/enterprise IdP
- [Kerberos cross-realm](../../../authentication/kerberos/cross-realm/README.md) — the Kerberos analogue of brokered cross-domain trust

## Files

- [sequence.md](./sequence.md) — a brokered login: HRD, upstream authN, claim mapping, downstream token
- [swimlane.md](./swimlane.md) — hub-and-spoke topology across trust zones
- [flowchart.md](./flowchart.md) — the broker's home-realm-discovery and routing decision
