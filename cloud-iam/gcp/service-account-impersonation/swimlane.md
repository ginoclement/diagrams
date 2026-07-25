---
title: "Service Account Impersonation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Service Account Impersonation — Swimlane Diagram

One lane per actor. The delegation branch shows an intermediate SA hop.

```mermaid
flowchart TD
    subgraph Caller["Caller (user / source SA)"]
        C1["Call generateAccessToken<br/>name = target SA"]
        C2["Use short-lived token<br/>against Google API"]
        C3(["Authorized as target SA"])
    end

    subgraph IAMCreds["IAM Credentials API"]
        K1["Receive request,<br/>read delegates if any"]
        K2["Ask IAM to check<br/>Token Creator on each edge"]
        K3["Mint short-lived token<br/>for target SA"]
        K4["Return 403 PERMISSION_DENIED"]
    end

    subgraph IAM["Cloud IAM"]
        M1{"roles/iam.serviceAccountTokenCreator<br/>on every edge?"}
    end

    subgraph TargetSA["Target SA"]
        T1["Identity whose permissions<br/>the token carries"]
    end

    subgraph API["Google API"]
        A1["Authorize using<br/>target SA bindings"]
    end

    C1 --> K1 --> K2 --> M1
    M1 -->|No| K4
    M1 -->|Yes| K3 --> T1 --> C2 --> A1 --> C3
```

Notes

- The token minted at `K3` carries `TargetSA`'s identity, so `A1` authorizes against the target
  SA's IAM policy, not the caller's.
- For a delegation chain, `M1` represents the AND of every hop's Token Creator check; any single
  failure routes to `K4`.
- A downloadable JSON key would bypass this entire flow with a long-lived secret — see the
  deprecated-practice note in the [README](README.md).
