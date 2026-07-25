# Workload / Non-Human Identity Diagrams

How software — services, jobs, CI runners, pods, VMs — proves *who it is* without a human
in the loop. Where [oidc/](../oidc/) and [saml/](../saml/) authenticate people, these
diagrams cover machine identity: platform-attested identities, short-lived credentials
exchanged from one trust domain to another, and the bootstrap problem of giving a workload
its very first identity. The recurring theme is **eliminating long-lived shared secrets**:
attest what the workload is, mint a credential that expires quickly, and rotate it
automatically. The lone legacy pattern here — static service-account keys — is kept for
reference and explicitly marked as discouraged.

## Diagrams

- [spiffe-spire-issuance](spiffe-spire-issuance/README.md) 🔵 — SPIFFE IDs issued by SPIRE: node attestation, workload attestation, and X.509-SVID / JWT-SVID issuance and automatic rotation over the Workload API.
- [workload-identity-federation-generic](workload-identity-federation-generic/README.md) 🔵 — the general pattern of exchanging a platform-issued OIDC token for short-lived target-cloud credentials, with no long-lived secret stored anywhere.
- [service-account-key-lifecycle](service-account-key-lifecycle/README.md) 🟡 — long-lived service-account key issuance, storage, rotation, and revocation; why static keys are discouraged and what to use instead.
- [secretless-instance-identity](secretless-instance-identity/README.md) ✅ — cloud instance-metadata identity bootstrap: the generic pattern behind IMDS / metadata servers that hands a VM short-lived credentials for its attached identity.
- kubernetes-serviceaccount-token *(planned)* ✅ — projected ServiceAccount tokens via the TokenRequest API: bound, audience-scoped, OIDC-verifiable, and exchangeable at external clouds.
- mutual-tls-bootstrap *(planned)* ✅ — issuing a workload its first identity: CSR plus attestation to a CA, then mutual TLS with the resulting certificate.

## Related categories

- [cloud-iam/](../cloud-iam/) — concrete implementations of these patterns:
  [aws/sts-assumerole](../cloud-iam/aws/sts-assumerole/README.md),
  [gcp/workload-identity-federation](../cloud-iam/gcp/workload-identity-federation/README.md),
  [gcp/gke-workload-identity](../cloud-iam/gcp/gke-workload-identity/README.md),
  [gcp/application-default-credentials](../cloud-iam/gcp/application-default-credentials/README.md),
  entra/managed-identity-imds *(planned)*,
  entra/workload-identity-federation *(planned)*.
- [network-security/](../network-security/) — [mtls-service-mesh](../network-security/mtls-service-mesh/README.md) consumes the SVIDs and bootstrap certs minted here.
- [tokenless/](../tokenless/) — [mutual-tls](../tokenless/mutual-tls/README.md) is the steady-state use of the certificate a workload bootstraps.
- [oidc/](../oidc/) — the token-exchange and JWKS validation these federation flows rely on.
</content>
</invoke>
