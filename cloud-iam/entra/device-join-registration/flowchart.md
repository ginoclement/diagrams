---
title: "Device Join and Registration — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Device Join and Registration — Decision Flowchart

Choosing the join type and passing the trust gates. Failure paths terminate explicitly.

```mermaid
flowchart TD
    Start(["Onboard a device to Entra"]) --> Owned{"Org-owned<br/>device?"}
    Owned -->|"No - personal/BYOD"| Reg["Entra Registered<br/>(workplace join)"]
    Owned -->|Yes| Domain{"Already domain-joined<br/>to on-prem AD?"}

    Domain -->|Yes| Hybrid["Entra Hybrid Join"]
    Domain -->|No| Join["Entra Join (cloud-only)"]

    Hybrid --> Scp{"SCP configured +<br/>Connect syncs device?"}
    Scp -->|No| ErrScp(["Fail: device never registers<br/>(fix SCP / Connect writeback)"])
    Scp -->|Yes| Key

    Join --> Key["Generate device key in TPM"]
    Reg --> Key

    Key --> Att{"TPM attestation<br/>available?"}
    Att -->|Yes| Attested["Register as TPM-attested"]
    Att -->|No| Soft["Register with software key<br/>(flagged not attested)"]

    Attested --> Obj["Device object created,<br/>device cert issued"]
    Soft --> Obj

    Obj --> CA{"CA requires attested /<br/>compliant device?"}
    CA -->|"Yes and not attested"| ErrCA(["Access denied: device<br/>trust insufficient"])
    CA -->|Otherwise| Done(["Device usable:<br/>PRT + Intune + CA signals"])
```

Notes

- Entra Join is the greenfield default; Hybrid Join exists to preserve on-prem AD and
  Group Policy dependencies during migration.
- A device object is created even without attestation, but stronger CA policies can refuse
  a non-attested / non-compliant device.
- Registered (BYOD) devices satisfy device-based CA without changing the user's primary
  sign-in identity.
