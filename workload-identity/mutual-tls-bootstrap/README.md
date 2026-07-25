# Mutual TLS Identity Bootstrap

**Status:** ✅ Current

## What it is

The **bootstrap** problem: a freshly started workload has no certificate yet, so how does it
prove who it is to obtain its *first* identity? This flow issues a workload its initial X.509
credential by combining a **Certificate Signing Request (CSR)** with **attestation evidence**
that a Certificate Authority (CA) can verify, then uses the signed leaf certificate for
steady-state **mutual TLS (mTLS)**. The attestation is what breaks the chicken-and-egg loop:
instead of a pre-shared secret, the workload presents platform-provided evidence of its
identity — a cloud Instance Identity Document (IID), a Kubernetes projected ServiceAccount
token, a TPM quote, or a one-time bootstrap/join token — alongside the public key it wants
certified.

The CA validates the evidence, confirms the requested identity (SPIFFE ID, DNS SAN, or
subject) is authorized for that attested principal, signs a **short-lived** leaf certificate,
and returns it with the trust bundle. From then on the workload authenticates with that
certificate over mTLS and **rotates** it before expiry — re-attesting or re-keying without
human involvement.

## When it is used

- Bringing a new VM, container, or device online in a zero-trust network where every
  connection is mutually authenticated and there are no long-lived shared secrets.
- The generic bootstrap that specialized systems refine: SPIRE node/workload attestation,
  service-mesh sidecar certificate provisioning, cloud instance identity.
- Any place a workload must get its first key material from a CA without an operator pasting
  in a secret.

## Actors

| Actor | Role |
|---|---|
| `Workload` | New process/host; generates a keypair, gathers attestation evidence, submits a CSR |
| `Attestor` | Platform authority that vouches for the workload: cloud IID service, k8s API, TPM, or a bootstrap-token issuer |
| `CA` | Certificate Authority / issuing service: verifies evidence, authorizes the identity, signs the leaf |
| `Peer` | The service the workload later connects to over mutual TLS |

## Key protocol details

- **Keypair generation** happens on the workload; the private key never leaves it. Only the
  public key travels in the CSR.
- **Attestation evidence** is bound to the request — either the CSR is signed/wrapped so the
  evidence cannot be lifted and reused, or the evidence itself is single-use (join token) or
  audience-bound (projected SA token).
- **Authorization**: the CA maps the attested principal (instance ID, SA, TPM EK) to the set
  of identities it may request, and refuses any identity outside that set.
- **Short TTL** on the leaf bounds exposure; the workload **rotates** by generating a new key
  and re-submitting a CSR (re-attesting if the evidence has also expired) before the current
  certificate lapses.
- **Trust bundle** (the CA roots) is returned so the workload can validate peers; both sides
  present certificates on the subsequent mTLS handshake.

## Alternate scenarios covered

- Cloud IID attestation versus a one-time bootstrap/join token versus TPM-backed evidence.
- Steady-state mutual TLS with the issued certificate.
- Rotation / re-key before expiry with no downtime.
- Failure paths: invalid or replayed evidence, an unauthorized requested identity, expired
  bootstrap token.

## Security notes

- The private key must be generated and held by the workload (ideally in a TPM/HSM or memory
  only) and **never** transmitted; the CSR carries the public key alone.
- Attestation evidence must be **freshness- and replay-protected**: single-use join tokens,
  short-lived audience-bound tokens, or nonce-challenged TPM quotes. Reusable evidence is a
  standing credential in disguise.
- The CA must **authorize** the requested identity against the attested principal — attestation
  proves "which node/pod", authorization decides "which identity that node/pod may hold".
- Keep leaf TTLs short and rotation automatic; a leaked short-lived certificate self-heals,
  a long-lived one does not.
- Protect and rotate the CA signing key; it is the root of every workload identity. Prefer an
  intermediate CA per trust domain so the root can stay offline.

## Related diagrams

- [tokenless/mutual-tls](../../tokenless/mutual-tls/README.md) — the steady-state mTLS handshake with the issued certificate.
- [network-security/mtls-service-mesh](../../network-security/mtls-service-mesh/README.md) — mesh sidecars consuming bootstrapped certificates.
- [spiffe-spire-issuance](../spiffe-spire-issuance/README.md) — SPIRE specializes this CSR-plus-attestation bootstrap.
- [kubernetes-serviceaccount-token](../kubernetes-serviceaccount-token/README.md) — a projected SA token used as bootstrap attestation evidence.
- [secretless-instance-identity](../secretless-instance-identity/README.md) — cloud IID as the attestation source.

## Files

- [sequence.md](sequence.md) — CSR-plus-attestation issuance, mTLS, and rotation with alt blocks.
- [swimlane.md](swimlane.md) — lanes for Workload, Attestor, CA, Peer.
- [flowchart.md](flowchart.md) — attestation and authorization gates with error terminals.
