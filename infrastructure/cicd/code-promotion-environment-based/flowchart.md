---
title: "Environment-Based Promotion — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Environment-Based Promotion — Decision Flowchart

The promotion logic: build once, then at every hop check the gate and re-verify provenance
before advancing the **same digest**. Halt, rollback, and refusal terminals are explicit.

```mermaid
flowchart TD
    S(["Merge to main"]) --> Build["Build artifact once"]
    Build --> Dig["Compute immutable digest,<br/>push to registry"]
    Dig --> DeployDev["Deploy digest to dev<br/>(dev config/secrets)"]

    DeployDev --> DevGate{"Dev tests<br/>pass?"}
    DevGate -->|No| Halt1(["Halt: fix and rebuild,<br/>prod unchanged"])
    DevGate -->|Yes| ProvS{"Signature + provenance<br/>of digest valid?"}

    ProvS -->|No| Refuse1(["Refuse promotion: unsigned<br/>or tampered artifact"])
    ProvS -->|Yes| PromoS["Promote SAME digest to staging<br/>(retag / copy, no rebuild)"]

    PromoS --> StgGate{"Integration<br/>tests pass?"}
    StgGate -->|No| Halt2(["Halt: prod stays on prior digest"])
    StgGate -->|Yes| Approve{"Human approval<br/>for prod?"}

    Approve -->|No / denied| Halt3(["Halt: promotion not authorized"])
    Approve -->|Yes| ProvP{"Signature + provenance<br/>re-verified?"}

    ProvP -->|No| Refuse2(["Refuse promotion: attestation failed"])
    ProvP -->|Yes| RebuildCheck{"Is this a<br/>rebuild of the digest?"}

    RebuildCheck -->|"Yes - forbidden"| DenyRebuild(["Deny: never rebuild<br/>between staging and prod"])
    RebuildCheck -->|"No - same digest"| PromoP["Promote SAME digest to prod<br/>(prod config/secrets)"]

    PromoP --> Health{"Prod healthy?"}
    Health -->|No| Rollback["Redeploy prior known-good digest<br/>(no rebuild)"] --> Done
    Health -->|Yes| Done(["Live: prod runs the exact<br/>artifact tested in staging"])
```

Notes

- Provenance is re-checked before *each* promotion (`ProvS`, `ProvP`), not only at build time.
- The `RebuildCheck` gate encodes the core rule: a promotion must carry the existing digest, so
  any rebuild between environments is denied outright.
- Rollback is a redeploy of a digest already in the registry — it never routes back through `Build`.
