# Environment-Based Promotion — Swimlane Diagram

One lane per component. The single digest built by CI flows left to right; each cross-lane
arrow into an environment is a promotion of the **same digest**, gated before it advances.

```mermaid
flowchart TD
    subgraph CI
        C1["Build artifact once"]
        C2["Compute immutable digest<br/>(sha256)"]
    end

    subgraph Registry
        R1["Store app@sha256:abc123"]
        R2["Verify signature + provenance<br/>before each promotion"]
        R3["Promote by retag / copy<br/>(same digest, no rebuild)"]
    end

    subgraph Deployer
        P1["Deploy digest to dev<br/>(dev config/secrets)"]
        P2["Promote digest to staging<br/>(staging config/secrets)"]
        P3["Await approval, then<br/>promote digest to prod<br/>(prod config/secrets)"]
    end

    subgraph Dev["Dev env"]
        D1["Run app@sha256:abc123"]
        D2{"Automated<br/>tests pass?"}
    end

    subgraph Staging["Staging env"]
        S1["Run same digest"]
        S2{"Integration tests<br/>+ approval?"}
    end

    subgraph Prod["Prod env"]
        PR1(["Run same digest<br/>tested in staging"])
    end

    C1 --> C2 --> R1
    R1 --> P1 --> D1 --> D2
    D2 -->|"No - halt"| Halt(["Promotion halts,<br/>prod unchanged"])
    D2 -->|Yes| R2
    R2 --> R3 --> P2 --> S1 --> S2
    S2 -->|"No - halt"| Halt
    S2 -->|Yes| P3 --> R3
    R3 --> PR1
```

Notes

- The one artifact (`app@sha256:abc123`) built in the CI lane is the only thing that moves;
  `R3` reuses it for every environment via retag/copy.
- Environment lanes differ only in injected config/secrets — never in the binary.
- Both gates (`D2`, `S2`) route failure to the same `Halt` terminal, leaving prod on its prior digest.
- Rollback (not drawn) is the Deployer redeploying a prior digest already stored in the Registry lane.
