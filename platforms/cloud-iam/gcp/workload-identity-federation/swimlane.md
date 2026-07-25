---
title: "Workload Identity Federation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Workload Identity Federation — Swimlane Diagram

One lane per actor. The Pool lane performs issuer/audience/condition validation and mapping.

```mermaid
flowchart TD
    subgraph Workload["Workload (CI job)"]
        W1["Get OIDC token from own IdP<br/>(audience = WIF provider)"]
        W2["POST token exchange to STS"]
        W3["Impersonate target SA<br/>with federated token"]
        W4(["Call Google APIs as target SA"])
    end

    subgraph ExtIdP["External IdP"]
        E1["Issue signed JWT<br/>with workload claims"]
    end

    subgraph STS["Google STS"]
        S1["Receive token-exchange request"]
        S2["Return federated access token"]
        S3["Return error"]
    end

    subgraph Pool["Pool + Provider"]
        P1["Verify issuer, audience,<br/>signature via JWKS"]
        P2{"attribute_condition<br/>satisfied?"}
        P3["Map claims to attributes,<br/>build principalSet"]
    end

    subgraph IAMCreds["IAM Credentials API"]
        K1{"principalSet has<br/>Token Creator on SA?"}
        K2["Mint target SA token"]
    end

    subgraph TargetSA["Target SA"]
        T1["Identity used against APIs"]
    end

    W1 --> E1 --> W2 --> S1 --> P1 --> P2
    P2 -->|No| S3
    P2 -->|Yes| P3 --> S2 --> W3 --> K1
    K1 -->|No| S3
    K1 -->|Yes| K2 --> T1 --> W4
```

Notes

- The Pool lane is the trust boundary: issuer, audience, signature, and `attribute_condition`
  must all pass before any Google credential is minted.
- The federated token from `S2` is not itself the final credential in the common pattern — it is
  spent at `K1`/`K2` to impersonate the target SA.
- A direct-access configuration would bind the `principalSet://` to a resource role and skip the
  IAMCreds lane entirely.
