---
title: "Device Posture Conditional Access — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Device Posture Conditional Access — Sequence Diagram

Happy path first (compliant managed device granted full access), then the non-compliant
limited/block, unmanaged, and attestation-failure alternates, plus the remediation loop.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Dev as Device
    participant Cli as Client
    participant PDP as PDP
    participant Comp as Compliance
    participant Res as Resource

    User->>Cli: Start access request
    Cli->>PDP: Authorization request (user identity)
    PDP->>PDP: Identity valid, evaluate device conditions
    PDP->>Dev: Require device certificate / attestation
    Dev-->>PDP: Present device cert + attestation
    PDP->>Comp: Query posture (encryption, patch, EDR, jailbreak)
    Comp-->>PDP: Managed + compliant

    alt Compliant managed device - grant
        PDP-->>Cli: Grant full access
        Cli->>Res: Access resource
        Res-->>User: Full session
    else Non-compliant device - limited or block
        Comp-->>PDP: Managed but out of policy (missing patch / no encryption)
        PDP-->>Cli: Grant limited session (browser-only, no download) or block
        Cli-->>User: Reduced access + remediation link
    else Unmanaged / BYOD - restricted
        PDP-->>Cli: Deny or browser-only restricted session
        Cli-->>User: Enroll device for full access
    else Attestation failure - deny
        Dev--xPDP: Cannot prove device identity / posture
        PDP-->>Cli: Deny - device untrusted
        Cli-->>User: Access denied
    end

    opt Remediation and retry
        User->>Dev: Encrypt / patch / re-enroll
        Dev->>Comp: Report updated posture
        User->>Cli: Retry access request
    end
```

Notes

- Identity is verified **before** device evaluation, but a valid user on a bad device still
  does not get full access, the device condition is a gate in its own right.
- Posture comes from the **Compliance** service against a hardware-backed attestation, not
  from the client's self-report, so the device cannot simply claim to be healthy.
- The limited-session branch keeps low-risk work possible on imperfect devices, which is why
  policy offers grant / limited / block rather than a single allow-or-deny.
