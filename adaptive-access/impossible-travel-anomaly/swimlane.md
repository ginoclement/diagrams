---
title: "Impossible Travel / Anomalous Session — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Impossible Travel / Anomalous Session — Swimlane Diagram

One lane per actor. The Detection lane computes the velocity anomaly from GeoIP data; the
Enforcement lane turns a verdict into step-up or revocation.

```mermaid
flowchart TD
    subgraph User
        U1["Sign-in event A"]
        U2["Sign-in / activity event B"]
        U3["Complete step-up"]
        U4(["Session continues"])
        U5(["Access denied"])
    end

    subgraph IdP
        I1["Record event A + B"]
        I2["Request travel evaluation"]
        I3["Apply policy to verdict"]
    end

    subgraph Detection
        T1["Compute velocity<br/>(distance / time delta)"]
        T2{"Travel feasible?"}
        T3{"Compounded with<br/>hard signal?"}
        T4["Downgrade on VPN /<br/>known travel"]
    end

    subgraph GeoIP
        G1["Resolve location + ASN / VPN"]
    end

    subgraph Enforcement
        E1["Force re-authentication"]
        E2{"Re-verified?"}
        E3["Revoke sessions, block"]
    end

    U1 --> I1
    U2 --> I1 --> I2
    G1 --> T1
    I2 --> T1 --> T2
    T2 -->|"Yes"| I3 --> U4
    T2 -->|"No - infeasible"| T4
    T4 -->|"Cleared"| U4
    T4 -->|"Still anomalous"| T3
    T3 -->|"No"| E1 --> E2
    E2 -->|"Yes"| U4
    E2 -->|"No"| E3 --> U5
    T3 -->|"Yes"| E3
    U3 --> E2
```

Notes

- The verdict is produced in the Detection lane (`T2`) from GeoIP input, the IdP lane only
  enforces it, keeping detection and policy separable.
- `T4` (VPN / known-travel downgrade) sits before enforcement so a benign corporate egress
  is cleared rather than driven into step-up or revocation.
- `T3` splits medium from high confidence: a bare anomaly goes to step-up `E1`, while one
  compounded with a hard signal skips straight to `E3` revoke.
