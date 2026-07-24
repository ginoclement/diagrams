# PKI Trust Hierarchy

## What it shows

A Public Key Infrastructure trust hierarchy: an **offline root CA** anchoring trust, one or
more **intermediate / issuing CAs** that actually sign certificates, and the **end-entity
certificates** issued to users, devices, and services. It also shows the supporting
machinery — **HSM key protection**, **CRL / OCSP revocation**, and the certificate
**lifecycle** (enrollment, renewal, revocation) — and the **trust boundaries** that keep
the root's private key air-gapped while day-to-day issuance happens at the intermediates.

This is the trust anchor behind [mTLS](../../tokenless/mutual-tls/README.md), token/assertion
signing in the [IdP](../identity-provider-reference-architecture/README.md), and the PKI
secret engine in [secrets management](../secrets-management/README.md). Enrollment protocols
that consume this hierarchy are in
[certificate enrollment (SCEP/EST)](../../enrollment-and-update/certificate-enrollment-scep-est/README.md).

## Actors / components

| Component | Role |
|---|---|
| Offline Root CA | The trust anchor; self-signed; kept air-gapped, signs only intermediates |
| Intermediate / Issuing CA | Online CA that signs end-entity certs; the day-to-day workhorse |
| Registration Authority (RA) | Vets and approves certificate requests before the CA signs |
| End Entity | User, device, or service that holds a leaf certificate + private key |
| HSM | Hardware module protecting CA private keys; signing happens inside it |
| CRL Distribution Point | Publishes Certificate Revocation Lists |
| OCSP Responder | Answers real-time "is this cert revoked?" queries |
| Relying Party | Verifier that builds and validates a certificate chain to the root |
| Trust Store | The relying party's set of trusted root certificates |

## Trust boundaries & security notes

- **The root is offline for a reason.** The root CA's private key is the single anchor of
  all trust; it is kept air-gapped in an HSM and used only to sign intermediate CA certs at
  infrequent ceremonies. Compromise of the root invalidates the entire hierarchy.
- **Intermediates do the work and absorb the risk.** Issuing CAs are online and sign
  end-entity certs at volume. If an intermediate is compromised, it can be revoked by the
  root and replaced without redistributing a new root to every relying party.
- **Keys never leave the HSM.** CA signing operations happen inside the HSM; the private
  key is non-exportable. This is the same protection the
  [secrets platform](../secrets-management/README.md) gives its master key.
- **Path validation is mandatory, not optional.** A relying party must build the chain from
  leaf to a trusted root, check each signature, validity window, name constraints, key
  usage / EKU, and basic-constraints (`CA:TRUE`, path length), then check revocation.
- **Revocation must be checked.** A cert can be valid-by-dates yet revoked; the RP consults
  a CRL or, preferably, OCSP (often stapled) to catch key compromise and mis-issuance.
- **Lifecycle is continuous:** enroll (CSR + RA vetting), issue, renew before expiry, and
  revoke on compromise or decommission. Short-lived leaf certs reduce reliance on revocation.
- **Name and policy constraints** on intermediates limit what they can issue, containing the
  damage a rogue or coerced issuing CA can do.

## Related diagrams

- [Secrets management](../secrets-management/README.md) — the PKI secret engine and HSM-protected keys
- [IdP reference architecture](../identity-provider-reference-architecture/README.md) — token/assertion signing keys
- [Mutual TLS client-cert auth](../../tokenless/mutual-tls/README.md) — leaf certs used for authentication
- [Certificate enrollment (SCEP/EST)](../../enrollment-and-update/certificate-enrollment-scep-est/README.md) — how end entities enroll
- [mTLS service mesh](../../network-security/mtls-service-mesh/README.md) — workload certs issued from this hierarchy

## Files

- [sequence.md](sequence.md) — enrollment + issuance from RA to issuing CA, then chain validation
- [swimlane.md](swimlane.md) — offline root / issuing tier / end-entity / revocation topology
- [flowchart.md](flowchart.md) — certificate path validation decision, with revocation gates
