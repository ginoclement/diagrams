# Environment-Based Promotion — Sequence Diagram

Happy path first: build the artifact once, then promote the **same digest** through dev,
staging, and prod behind gates. Then alternates: a staging gate failure that halts before
prod, a rollback to a prior good digest, a hotfix rebuild re-entering from dev, and a
provenance check that refuses a bad digest.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant CI as CI
    participant Reg as Registry
    participant Dep as Deployer
    participant D as Dev env
    participant S as Staging env
    participant P as Prod env
    participant Apr as Approver

    Dev->>CI: Merge to main
    CI->>CI: Build artifact once
    CI->>CI: Compute immutable digest<br/>(sha256 of image)
    CI->>Reg: Push artifact by digest
    Reg-->>CI: Stored app@sha256:abc123

    CI->>Dep: Deploy digest to dev<br/>(with dev config/secrets)
    Dep->>D: Run app@sha256:abc123
    D-->>Dep: Healthy
    Dep->>D: Run automated tests
    D-->>Dep: Tests pass

    Note over Dep,S: Promotion = retag/copy the SAME digest,<br/>never a rebuild

    Dep->>Reg: Verify signature + provenance of digest
    Reg-->>Dep: Attestation valid
    Dep->>Reg: Promote app@sha256:abc123 to staging<br/>(retag / copy, same digest)
    Dep->>S: Deploy digest with staging config/secrets
    S->>S: Integration tests
    S-->>Dep: Integration tests pass

    Dep->>Apr: Request approval for prod promotion
    Apr-->>Dep: Approved

    Dep->>Reg: Verify signature + provenance of digest
    Reg-->>Dep: Attestation valid
    Dep->>Reg: Promote app@sha256:abc123 to prod<br/>(same digest, no rebuild)
    Dep->>P: Deploy digest with prod config/secrets
    P-->>Dep: Healthy - same artifact tested in staging

    alt Staging gate fails
        S-->>Dep: Integration tests fail
        Dep->>Dep: Halt promotion
        Note over Dep,P: Prod untouched, still on prior digest
    end

    alt Rollback in prod
        Dep->>Reg: Select prior known-good digest<br/>(app@sha256:prev)
        Dep->>P: Redeploy prior digest<br/>(no rebuild)
        P-->>Dep: Restored
    end

    alt Hotfix
        Dev->>CI: Push hotfix
        CI->>CI: Build new artifact once
        CI->>Reg: Push app@sha256:hot456
        Note over CI,P: Hotfix re-enters the SAME path from dev,<br/>never pushed straight to prod
    end

    alt Provenance check fails before promotion
        Dep->>Reg: Verify signature + provenance
        Reg-->>Dep: Attestation invalid / missing
        Dep->>Dep: Refuse promotion, alert
    end
```

Notes

- The digest `app@sha256:abc123` is computed once at build and is the only thing promoted;
  every environment runs that byte-for-byte identical artifact.
- Config and secrets are injected per environment at deploy time — the binary never changes.
- "Promote" is always a retag or cross-registry copy of the existing digest, never `docker build`.
- Rollback selects a prior digest already in the registry; it is a redeploy, not a rebuild.
