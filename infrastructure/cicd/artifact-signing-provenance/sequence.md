---
title: "Artifact Signing and Provenance — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Artifact Signing and Provenance — Sequence Diagram

Happy path first (keyless build-time sign + attest, then verify at admission), followed by the
rejection alternates: unsigned image, untrusted signer identity, provenance fails policy, and
the key-based signing variant.

```mermaid
sequenceDiagram
    autonumber
    participant CI as CI Build
    participant Fulcio as Fulcio CA
    participant Rekor as Rekor log
    participant Reg as Registry
    participant Adm as Admission gate
    participant K8s as Cluster

    CI->>CI: Build image, compute digest<br/>sha256:abc...
    CI->>Fulcio: Request signing cert<br/>with OIDC identity token
    Fulcio->>Fulcio: Verify OIDC identity<br/>(issuer + subject)
    Fulcio-->>CI: Short-lived signing cert<br/>bound to identity
    CI->>CI: cosign sign digest<br/>with ephemeral key
    CI->>Rekor: Record signature + cert
    Rekor-->>CI: Log entry (inclusion proof)
    CI->>CI: Generate SLSA provenance<br/>(source, builder, materials) as in-toto attestation
    CI->>Reg: Push image + signature + attestation

    Note over Reg,K8s: Later, at deploy time

    K8s->>Adm: Admit image sha256:abc...?
    Adm->>Reg: Fetch signature + attestation
    Adm->>Rekor: Verify entry / inclusion proof
    Adm->>Adm: Verify signer identity<br/>(OIDC issuer + subject on allow-list)
    Adm->>Adm: Verify provenance<br/>(builder trusted, SLSA level met, source repo)
    Adm-->>K8s: Admit - run the artifact

    alt Unsigned image
        K8s->>Adm: Admit image with no signature
        Adm->>Reg: No signature found
        Adm-->>K8s: Deny - unsigned artifact
    end

    alt Untrusted signer identity
        K8s->>Adm: Admit image signed by unexpected identity
        Adm->>Adm: Cert identity not on allow-list<br/>(wrong issuer or subject)
        Adm-->>K8s: Deny - untrusted signer
    end

    alt Provenance fails policy
        K8s->>Adm: Admit image with mismatched provenance
        Adm->>Adm: Source repo or builder wrong,<br/>or SLSA level below required
        Adm-->>K8s: Deny - provenance policy failure
    end

    alt Key-based signing variant (long-lived key)
        CI->>CI: cosign sign digest with stored private key
        Note over CI,Adm: Key must be stored and rotated.<br/>Admission verifies against the matching public key<br/>instead of an OIDC identity. Keyless is preferred.
    end
```

Notes

- Keyless signing binds the signature to the CI job's OIDC identity via Fulcio; the
  certificate is short-lived, so there is no signing key at rest.
- Rekor gives tamper-evidence: the admission gate can confirm the signature was logged.
- Admission enforces **identity + provenance**, not merely "a signature exists" — the three
  deny branches are all valid-looking artifacts that fail an identity or policy check.
