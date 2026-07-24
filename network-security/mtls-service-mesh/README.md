# mTLS in a Service Mesh

Inside a service mesh (Istio, Linkerd, Consul), every workload gets a **sidecar proxy**
that transparently wraps its traffic in mutual TLS. Each workload has a cryptographic
identity — a **SPIFFE ID** (`spiffe://trust-domain/ns/…/sa/…`) carried in an
**SVID** (SPIFFE Verifiable Identity Document, an X.509 cert or JWT). A **control plane**
issues these certs, keeps them **short-lived**, and rotates them automatically. When
service A calls service B, the two sidecars perform a mutual-TLS handshake, each
verifying the other's SVID against the mesh's trust bundle, and the mesh enforces
**authorization policy** on the authenticated identity — not on IP addresses.

## What it shows

- Sidecar-to-sidecar **mutual TLS** established transparently on behalf of the app
  workloads (the app speaks plaintext to its local proxy over loopback).
- **Workload identity**: how a workload proves who it is (attestation) and receives a
  short-lived **SVID** from the control plane / SPIFFE agent.
- The control plane acting as (or fronting) the CA that signs SVIDs, and pushing
  identity + policy to the data-plane proxies.
- **Authorization policy** evaluated on the verified peer SPIFFE ID after the handshake.

## Actors / components

| Component | Role |
|---|---|
| Workload A / B | Application containers; speak plaintext to their local sidecar |
| Sidecar A / B | Data-plane proxies (Envoy) that terminate/originate mTLS |
| SPIFFE agent / node agent | Attests the workload and fetches its SVID + trust bundle |
| Control plane | Issues identity + config; e.g. istiod / SPIRE server |
| Mesh CA | Signs short-lived SVIDs (may be the control plane or an upstream CA) |

## Alternate scenarios covered

- **Certificate rotation** — SVIDs are short-lived (often minutes to hours); the agent
  proactively re-issues and hot-swaps the cert with no connection drop.
- **Identity from workload attestation** — the agent proves a workload's identity from
  platform facts (Kubernetes service account token, pod UID, node identity) before any
  SVID is issued; nothing is trusted on the workload's say-so.
- **Policy deny** — the handshake succeeds (peer identity is valid) but an
  authorization policy denies the call based on the source SPIFFE ID.
- **Permissive to strict migration** — mesh runs in *permissive* mode (accepts both
  plaintext and mTLS) during rollout, then flips to *strict* (mTLS required) once all
  workloads have sidecars.

## Security notes

- **Identity is cryptographic, not network-based.** Authorization keys off the verified
  SPIFFE ID in the peer SVID, so moving a workload's IP or landing in the same subnet
  grants nothing. This is the zero-trust "never trust the network" principle in practice.
- **Short-lived SVIDs shrink the blast radius.** A leaked cert expires in minutes and
  rotation is automatic, so revocation (CRL/OCSP) is largely unnecessary — expiry does
  the work. Protect the private key in memory; ideally it never touches disk.
- **Attestation is the root of trust.** If the node/workload attestation can be spoofed,
  an attacker can obtain a legitimate identity. Bind SVIDs to strong platform selectors.
- **Permissive mode is a transition state, not a destination.** While permissive, an
  attacker can still speak plaintext to a workload; drive rollout to *strict* and alert
  on any remaining plaintext.
- **mTLS authenticates workloads, not users.** End-user identity must still be carried
  and checked at the application layer; the mesh secures service-to-service transport.
- Keep the trust bundle distribution tight — a rogue CA in the bundle mints trusted
  identities across the whole mesh.

## Related diagrams

- [Mutual TLS (client-certificate authentication)](../../tokenless/mutual-tls/README.md) — the underlying mTLS handshake and cert validation this builds on.
- [TLS 1.3 handshake](../tls-handshake/README.md) — the handshake the sidecars run.
- [Zero-trust architecture](../../architecture/zero-trust-architecture/README.md) — the model service-mesh mTLS implements for east-west traffic.
- [PKI hierarchy](../../architecture/pki-hierarchy/README.md) — how the mesh CA chains to a root.
- [API gateway authn/authz](../../architecture/api-gateway-authn-authz/README.md) — north-south identity at the mesh edge.

## Files

- [sequence.md](sequence.md) — attestation, SVID issuance, sidecar mTLS handshake, policy check, and alts.
- [swimlane.md](swimlane.md) — Workload / Sidecar / Agent / Control-plane lanes across trust domains.
- [flowchart.md](flowchart.md) — connection decision: identity valid, mode strict/permissive, policy allow/deny.
