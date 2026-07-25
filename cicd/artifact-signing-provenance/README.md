# Artifact Signing and Provenance (Verify on Deploy)

**Status:** 🔵 Emerging

## Purpose

Prove that a deployed artifact was built by a trusted pipeline from trusted source, and refuse
anything that cannot prove it. Two things are produced at build time and checked at deploy
time:

- **Signature** — the build signs the artifact/image **digest**. With **Sigstore/cosign
  keyless** signing, cosign obtains an OIDC identity token, **Fulcio** issues a short-lived
  signing certificate bound to that identity, cosign signs the digest, and the signature +
  certificate are recorded in the **Rekor** transparency log. No signing key is stored.
- **Provenance** — the build platform emits a signed **in-toto attestation** describing the
  build: source, builder, and materials. **SLSA** levels (L1..L3/L4) grade how tamper-resistant
  and non-falsifiable that provenance is.

At deploy, an **admission controller / deploy gate** (cosign verify, Kyverno or the Sigstore
policy-controller, or **Binary Authorization** on GCP) verifies the signature **identity**,
verifies the provenance meets the required SLSA level and builder, and only then admits the
artifact.

## When it's used

- Container images and release artifacts promoted into environments that require supply-chain
  guarantees.
- Clusters or deploy gates that must reject unsigned or untrusted-origin artifacts before they
  run (Kubernetes admission, GCP Binary Authorization).
- Pipelines already using [OIDC to cloud federation](../oidc-to-cloud-federation/README.md) —
  keyless signing reuses the same CI OIDC identity.

## Actors / components

| Actor | Role |
|---|---|
| CI | Build pipeline; builds the image, computes the digest, signs, attests |
| Fulcio | Sigstore CA; issues short-lived signing cert bound to an OIDC identity |
| Rekor | Sigstore transparency log; tamper-evident record of signature + cert |
| Registry | Stores the image plus its signature and attestations |
| Admission | Deploy gate / admission controller verifying signature + provenance |
| Cluster | Runtime that runs admitted artifacts |

## Alternate scenarios covered

- **Keyless (preferred) vs key-based signing** — the OIDC + Fulcio + Rekor path, contrasted
  with a long-lived signing key that must be stored and rotated.
- **Unsigned image rejected** — no signature found at admission → denied.
- **Untrusted signer identity rejected** — a valid signature, but the certificate identity
  (OIDC subject/issuer) is not on the allow-list → denied.
- **Provenance fails policy** — provenance present but its source repo or builder does not
  match policy, or the SLSA level is too low → denied.

## Security notes

- **Prefer keyless** signing — no signing key to store, leak, or rotate; identity is bound at
  signing time and logged.
- **Verify the signer identity, not just the presence of a signature** — require a specific
  OIDC issuer and subject (e.g. the exact workflow), not "any valid signature".
- Require provenance from a **trusted builder** and enforce a minimum SLSA level, not merely
  that some attestation exists.
- Use the **transparency log (Rekor)** for tamper-evidence; an entry proves the signature
  existed at a point in time.
- **Verify at admission**, not only at build — build-time checks do not stop a tampered or
  unsigned artifact from being deployed by another path.

## Diagrams

- [sequence.md](sequence.md) — keyless sign + attest at build, verify at admission, plus rejection alternates.
- [swimlane.md](swimlane.md) — lanes for CI, Fulcio/Rekor, Registry, Admission, Cluster.
- [flowchart.md](flowchart.md) — admission-time verification gates with explicit deny terminals.

## Related diagrams

- [OIDC to cloud federation](../oidc-to-cloud-federation/README.md) — keyless signing reuses the CI OIDC identity.
- [Environment-based code promotion](../code-promotion-environment-based/README.md) — where signed artifacts move between environments.
- [GitOps pull-based deploy](../gitops-pull-based-deploy/README.md) — the deploy side that enforces verification.
- [CI/CD security and delivery](../README.md) — category index.
