---
title: "Device Enrollment (MDM) — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Device Enrollment (MDM) — Swimlane

Lanes for User, Device, MDM Server, CA, and IdP Server. The device generates its own key
pair and installs profiles; the MDM orchestrates policy and the CA issues the identity
certificate.

```mermaid
flowchart TD
    subgraph User
        U1["Start enrollment"]
        U2["Authenticate"]
        U3["Consent to management"]
    end

    subgraph Device
        D1["Install management profile,<br/>register for push"]
        D2["Report posture"]
        D3["Generate key pair + CSR"]
        D4["Install identity cert<br/>+ Wi-Fi / VPN profiles"]
        DQ["Show remediation steps"]
    end

    subgraph MDM["MDM Server"]
        M1["Issue enrollment profile"]
        M2{"Compliance policy<br/>passes?"}
        M3["Forward CSR to CA"]
        M4["Mark managed + compliant"]
        MQ["Mark non-compliant"]
    end

    subgraph CA
        C1["Issue device<br/>identity certificate"]
    end

    subgraph IdP["IdP Server"]
        I1["Verify user identity"]
        I2["Allow conditional access"]
        IQ["Quarantine / block"]
    end

    U1 --> M1
    M1 --> U2 --> I1 --> U3 --> D1 --> M2
    D2 --> M2
    M2 -->|yes| D3 --> M3 --> C1 -->|signed cert| M4 --> D4
    M4 --> I2
    M2 -->|no| MQ --> IQ
    MQ --> DQ
```
