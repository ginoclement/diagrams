# SPIFFE Identity Issuance with SPIRE

**Status:** 🔵 Emerging

## What it is

SPIFFE (Secure Production Identity Framework For Everyone) defines a platform-neutral
workload identity — the **SPIFFE ID**, a URI of the form
`spiffe://<trust-domain>/<path>` (e.g. `spiffe://example.org/ns/prod/sa/frontend`) — and
the **SVID** (SPIFFE Verifiable Identity Document) that carries it. SPIRE is the reference
implementation: a **SPIRE Server** that acts as the trust-domain signing authority and
registry, and a **SPIRE Agent** on each node that attests the node to the server, then
attests local workloads and hands each one an SVID over the **Workload API** (a Unix domain
socket). SVIDs come in two forms: an **X.509-SVID** (an X.509 certificate whose SPIFFE ID
sits in the URI SAN) for mTLS, and a **JWT-SVID** (a JWT whose `sub` is the SPIFFE ID and
whose `aud` names the intended service) for token-based calls.

## When it is used

- Service-to-service mTLS in a mesh or across heterogeneous platforms (bare metal, VMs, Kubernetes, multiple clouds) where a single, portable identity is wanted.
- As the identity substrate under [network-security/mtls-service-mesh](../../network-security/mtls-service-mesh/README.md).
- When you want short-lived, automatically rotated credentials with no secrets on disk and no cloud-vendor lock-in for identity.

## Actors

| Actor | Role |
|---|---|
| Workload | The process needing an identity; calls the Workload API over a UDS |
| Agent | SPIRE Agent on the node: node attestation to server, workload attestation locally, SVID delivery |
| Server | SPIRE Server: signing CA for the trust domain, holds registration entries, mints SVIDs |
| Attestor | Node/workload attestor plugins and any external attestation authority (cloud IID service, k8s API, TPM) |

## Key protocol details

- **Node attestation**: the agent proves node identity with a node attestor plugin — AWS Instance Identity Document, GCP instance identity token, Azure MSI, Kubernetes PSAT (projected SA token), `x509pop`, TPM, or a one-time join token. The server verifies it, issues the agent an SVID, and derives node selectors.
- **Workload attestation**: when a workload connects to the Workload API socket, the agent reads the caller's kernel-provided peer credentials (PID) and runs workload attestor plugins (`unix` uid/gid/path, `docker` labels, `k8s` pod introspection via the kubelet) to produce selectors.
- **Registration entries** map selectors to a SPIFFE ID, with a parent ID, TTL, optional DNS SANs, and federation relationships. The server issues the SVID(s) whose selectors the workload satisfies.
- **Rotation**: X.509-SVIDs are short-lived (default 1h). The agent streams updates over the Workload API and pushes a fresh SVID before expiry; the server rotates agent SVIDs and its own CA.
- **Trust bundle**: the set of CA certificates for the trust domain, distributed to verifiers. **SPIFFE Federation** exchanges bundles between trust domains via each domain's HTTPS bundle endpoint.

## Alternate scenarios covered

- JWT-SVID issuance and `FetchJWTSVID` for a named audience, versus X.509-SVID for mTLS.
- Node attestation failure (unknown/spoofed node) and workload attestation with no matching registration entry.
- SVID rotation mid-lifetime with no interruption.
- Cross-trust-domain federation: verifying a foreign SVID against a federated bundle.

## Security notes

- Attestation is the root of trust: a workload gets only the identity whose selectors it genuinely matches — do not write over-broad registration entries (e.g. unix uid alone on a shared host).
- Short TTLs bound the blast radius of a leaked SVID; keep rotation automatic and never persist private keys.
- The Workload API socket must be protected by filesystem permissions — anyone who can reach it can request whatever the local selectors grant.
- JWT-SVIDs must be validated on `aud`: a JWT-SVID minted for one service must be rejected by another (prevents token replay across services). Prefer X.509-SVID mTLS where mutual authentication is possible.
- Federation trust is only as good as bundle-endpoint authentication; pin/verify the endpoint's own SPIFFE bundle.

## Related diagrams

- [mutual-tls-bootstrap](../mutual-tls-bootstrap/README.md) — the generic CSR-plus-attestation bootstrap this specializes.
- [network-security/mtls-service-mesh](../../network-security/mtls-service-mesh/README.md) — SVIDs consumed by sidecar proxies.
- [tokenless/mutual-tls](../../tokenless/mutual-tls/README.md) — steady-state mTLS with the issued certificate.
- [kubernetes-serviceaccount-token](../kubernetes-serviceaccount-token/README.md) — the PSAT used as a SPIRE node/workload attestor.

## Files

- [sequence.md](sequence.md) — node attestation, workload attestation, and SVID issuance/rotation with alt blocks.
- [swimlane.md](swimlane.md) — lanes for Workload, Agent, Server, Attestor.
- [flowchart.md](flowchart.md) — attestation and entry-matching decisions with error terminals.
</content>
