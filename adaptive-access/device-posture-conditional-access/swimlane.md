# Device Posture Conditional Access — Swimlane Diagram

One lane per actor. The PDP lane holds the decision; the Device and Compliance lanes supply
the attestation and posture the decision depends on.

```mermaid
flowchart TD
    subgraph User
        U1["Start access request"]
        U2(["Full access"])
        U3(["Limited access"])
        U4(["Access denied"])
        U5["Remediate + retry"]
    end

    subgraph Device
        D1["Present device cert + attestation"]
        D2["Report posture to MDM"]
    end

    subgraph Client
        C1["Send authorization request"]
        C2["Open session or show denial"]
    end

    subgraph PDP["PDP"]
        P1["Verify identity"]
        P2{"Device identity<br/>attested?"}
        P3{"Managed +<br/>compliant?"}
        P4["Issue full access"]
        P5["Issue limited session"]
        P6["Block"]
    end

    subgraph Compliance
        M1["Evaluate posture<br/>(encryption, patch, EDR, jailbreak)"]
    end

    subgraph Resource
        R1["Serve per granted scope"]
    end

    U1 --> C1 --> P1 --> P2
    D1 --> P2
    P2 -->|"No - attestation fails"| P6
    P2 -->|"Yes"| M1 --> P3
    P3 -->|"Compliant managed"| P4 --> C2 --> R1 --> U2
    P3 -->|"Non-compliant"| P5 --> C2 --> U3
    P3 -->|"Unmanaged / BYOD"| P6 --> C2 --> U4
    U5 --> D2 --> M1
    U3 --> U5
```

Notes

- `P2` (attestation) and `P3` (posture) are the two device gates layered on top of identity
  `P1`, a failure at either downgrades or blocks regardless of who the user is.
- The Compliance lane (`M1`) is the source of truth for posture, the PDP never takes the
  device's own word, it acts on the MDM's evaluation of a hardware-backed claim.
- The remediation loop `U5 --> D2 --> M1` lets a fixed device re-enter evaluation without a
  new identity check, converting a `limited` outcome into `full` once compliant.
