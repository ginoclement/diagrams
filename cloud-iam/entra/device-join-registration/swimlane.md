---
title: "Device Join and Registration — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Device Join and Registration — Swimlane

One lane per component. The on-prem AD lane participates only in the Hybrid Join branch.

```mermaid
flowchart TD
    subgraph User
        U1["Start join / register"]
        U2(["Device has an identity"])
    end

    subgraph Device
        D1["Authenticate user / read SCP"]
        D2["Generate device key pair"]
        D3["Send registration request"]
        D4["Store device certificate"]
    end

    subgraph TPM
        T1["Create key, produce<br/>attestation statement"]
        T2["Protect device cert key"]
    end

    subgraph DRS
        R1["Validate request + attestation"]
        R2["Issue device certificate"]
    end

    subgraph Entra
        E1["Create / update device object"]
        E2{"Join type?"}
    end

    subgraph ADDS
        A1["Provide SCP + computer identity"]
    end

    U1 --> D1 --> D2 --> T1 --> D3 --> R1 --> E1 --> E2
    E2 -->|Entra Joined| R2
    E2 -->|Entra Registered| R2
    E2 -->|Hybrid Joined| A1 --> R2
    R2 --> D4 --> T2 --> U2
```

Notes

- The `A1` (on-prem AD) node only appears on the Hybrid Join path, supplying the SCP and
  the computer identity used to register.
- Whether the device is flagged TPM-attested depends on `T1` producing a valid attestation
  statement; software-key fallback still creates a device object but marks it not attested.
