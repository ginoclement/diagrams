---
title: "Continuous Access Evaluation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Continuous Access Evaluation — Swimlane Diagram

One lane per actor. Signal sources publish the critical event; the API turns it into a
claims challenge; the IdP re-evaluates.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in"]
        U2(["Keeps working"])
        U3(["Access revoked"])
    end

    subgraph Client
        C1["Request CAE-capable token"]
        C2["Call API"]
        C3["Reauthorize with claims challenge"]
        C4["Retry with fresh token"]
    end

    subgraph API
        A1["Validate token + session state"]
        A2{"Session flagged<br/>for re-evaluation?"}
        A3["Serve request"]
        A4["401 claims challenge"]
    end

    subgraph IdP
        I1["Issue CAE-capable token"]
        I2["Mark session for re-evaluation"]
        I3{"Conditions still<br/>satisfied?"}
        I4["Issue fresh token"]
        I5["Deny - no new token"]
    end

    subgraph Sig["Signal sources"]
        G1["Admin: disable / sign-out"]
        G2["Directory: password reset, MFA revoke"]
        G3["Risk engine: elevated risk"]
        G4["Network: IP / location change"]
    end

    U1 --> C1 --> I1 --> C2 --> A1 --> A2
    A2 -->|No| A3 --> U2
    G1 --> I2
    G2 --> I2
    G3 --> I2
    G4 --> I2
    I2 --> A2
    A2 -->|Yes| A4 --> C3 --> I3
    I3 -->|Yes| I4 --> C4 --> A3
    I3 -->|No| I5 --> U3
```

Notes

- The critical events in the Signal sources lane all funnel into the IdP's
  "mark for re-evaluation" step (`I2`); the API discovers the flag on the next call.
- The claims challenge (`A4 --> C3`) is the only cross-lane path back to the IdP mid-session —
  it is what makes revocation near-real-time.
- See [flowchart.md](flowchart.md) for the honour / challenge / re-issue / deny logic.
