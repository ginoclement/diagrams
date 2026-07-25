---
title: "Windows Hello for Business — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Windows Hello for Business — Swimlane

One lane per component. The DC lane participates only for on-prem resource access.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in + MFA"]
        U2["Set PIN / biometric"]
        U3["Present gesture at logon"]
        U4(["Signed in, SSO ready"])
    end

    subgraph Device
        D1["Confirm provisioning allowed"]
        D2["Drive key setup"]
        D3["Sign nonce, request PRT"]
        D4["Request on-prem TGT"]
    end

    subgraph TPM
        T1["Generate per-user key"]
        T2["Hold private key,<br/>unlock on gesture"]
    end

    subgraph Entra
        E1["Confirm MFA for provisioning"]
        E2["Register public key"]
        E3{"Signature matches<br/>registered key?"}
        E4["Issue PRT + partial TGT"]
    end

    subgraph DC
        C1["PKINIT / exchange partial TGT"]
        C2["Issue Kerberos TGT"]
    end

    U1 --> D1 --> E1 --> U2 --> D2 --> T1 --> E2
    U3 --> T2 --> D3 --> E3
    E3 -->|Yes| E4 --> U4
    E3 -->|No| Deny(["Deny: signature invalid"])
    E4 --> D4 --> C1 --> C2
```

Notes

- Provisioning (top) happens once per device and depends on a prior MFA at `E1`.
- Everyday logon is the gesture -> TPM -> signed nonce -> Entra path; on-prem access
  extends through the DC lane via Cloud Kerberos or key trust.
