# Mover — Role Change Swimlane Diagram

One lane per actor. The IGA lane carries the re-evaluation and SoD logic; adds and revokes
fan out to the IdP and app lanes, and the manager lane gates grants and exceptions.

```mermaid
flowchart TD
    subgraph HR["HR / Source of Truth"]
        H1["Attribute change<br/>(dept / job / manager)"]
        H2["Emit change event"]
    end

    subgraph IGA["IGA Engine"]
        G1["Recompute target entitlements<br/>for the new role"]
        G2["Diff current vs target"]
        G3["Derive adds + revokes<br/>(retain overlaps)"]
        G4{"Move type?"}
        G5["Immediate revoke of stale access"]
        G6["Grace window:<br/>schedule timed removal"]
        G7{"SoD conflict in<br/>post-change held set?"}
        G8["Route to approval"]
        G9["Apply changes via SCIM"]
    end

    subgraph IdP["IdP / Directory"]
        I1["Add new-role groups"]
        I2["Remove stale groups"]
        I3["Timed removal on expiry"]
    end

    subgraph App["Downstream App"]
        A1["Provision new entitlements"]
        A2["Deprovision stale entitlements"]
        A3([Access aligned to new role])
    end

    subgraph Manager["Manager / Owner"]
        M1{"Approve grants<br/>+ revokes?"}
        M2{"Approve SoD<br/>exception?"}
    end

    H1 --> H2 --> G1 --> G2 --> G3 --> G4
    G4 -->|standard move| G5
    G4 -->|lateral / handover| G6
    G5 --> G7
    G6 --> G7
    G7 -->|conflict| M2
    G7 -->|no conflict| G8
    M2 -->|approved with control| G8
    M2 -->|rejected| G8
    G8 --> M1
    M1 -->|approved| G9
    M1 -->|rejected| A3
    G9 --> I1 --> A1
    G9 --> I2 --> A2
    G6 -.-> I3
    A1 --> A3
    A2 --> A3
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
