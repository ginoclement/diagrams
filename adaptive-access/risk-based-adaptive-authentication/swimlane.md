# Risk-Based Adaptive Authentication — Swimlane Diagram

One lane per actor. The decision lives in the Risk engine lane; the IdP lane enforces it.

```mermaid
flowchart TD
    subgraph User
        U1["Start sign-in"]
        U2["Submit primary factor"]
        U3["Complete step-up<br/>(only if challenged)"]
        U4(["Signed in"])
        U5(["Access denied"])
    end

    subgraph Client
        C1["Send authorization request"]
        C2["Receive tokens or denial"]
    end

    subgraph IdP
        I1["Verify primary factor"]
        I2["Gather signals for scoring"]
        I3["Apply policy to risk level"]
        I4["Issue tokens with acr / amr"]
        I5["Block and alert"]
    end

    subgraph Risk["Risk engine"]
        R1["Score signals + history"]
        R2{"Risk level?"}
        R3["Re-score after step-up"]
    end

    subgraph Sig["Signal sources"]
        G1["Device / posture agent"]
        G2["Geo-IP + velocity"]
        G3["IP / ASN reputation, threat intel"]
        G4["Leaked-credential database"]
    end

    U1 --> C1 --> I1 --> U2 --> I1
    I1 --> I2
    G1 --> I2
    G2 --> I2
    G3 --> I2
    G4 --> I2
    I2 --> R1 --> R2
    R2 -->|Low| I3 --> I4 --> C2 --> U4
    R2 -->|Medium| U3 --> R3
    R3 -->|Acceptable| I4
    R3 -->|Not met| I5
    R2 -->|High| I5 --> C2 --> U5
```

Notes

- Signal sources feed the IdP's collection step (`I2`); the engine (`R1`) turns them into a
  single level the policy (`I3`) can act on.
- The medium branch loops back through the engine (`R3`) so a satisfied step-up actually
  lowers residual risk rather than blindly allowing.
- See [flowchart.md](flowchart.md) for the full ordering of hard-vs-soft signal precedence.
