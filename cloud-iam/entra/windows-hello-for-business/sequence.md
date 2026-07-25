---
title: "Windows Hello for Business — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Windows Hello for Business — Sequence Diagram

Happy path first (provisioning, then gesture logon), followed by on-prem access via the
trust models, biometric fallback, and PIN lockout.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Dev as Device
    participant TPM as TPM
    participant Entra as Entra
    participant DC as DC

    Note over User,Entra: Provisioning (one time per device)
    User->>Dev: Sign in, complete MFA
    Dev->>Entra: Confirm MFA satisfied for provisioning
    Entra-->>Dev: Provisioning allowed
    User->>Dev: Set up PIN / enroll biometric
    Dev->>TPM: Generate per-user WHfB key pair
    TPM-->>Dev: Public key (private key stays in TPM)
    Dev->>Entra: Register public key on user object
    Entra-->>Dev: Key registered (usable as credential)

    Note over User,Entra: Everyday logon
    User->>Dev: Enter PIN / present biometric
    Dev->>TPM: Gesture unlocks WHfB private key
    Dev->>Entra: Sign nonce with WHfB key, request PRT
    Entra->>Entra: Verify signature against registered public key
    Entra-->>Dev: PRT with strong-auth (MFA) claim
    Dev-->>User: Desktop unlocked, SSO ready

    alt On-prem access - Cloud Kerberos trust
        Dev->>Entra: Request partial Kerberos TGT
        Entra-->>Dev: Partial TGT
        Dev->>DC: Exchange for full TGT
        DC-->>Dev: TGT for on-prem resources
    else Key trust (PKINIT at DC)
        Dev->>DC: PKINIT using WHfB key mapped via msDS-KeyCredentialLink
        DC-->>Dev: Kerberos TGT
    else Certificate trust (legacy)
        Note over Dev,DC: Enterprise CA issued a logon cert from the WHfB key,<br/>DC validates the cert chain
    end

    alt Biometric not recognized
        Dev-->>User: Fall back to PIN prompt
    else Too many bad PIN attempts
        TPM->>TPM: Anti-hammering lockout
        Dev-->>User: PIN temporarily locked, use recovery
    end
```

Notes

- Provisioning requires a prior MFA, the WHfB key then becomes a portable proof of that
  strong authentication for future sign-ins.
- The private key never leaves the TPM, only signatures do, so the credential cannot be
  phished or replayed from another device.
- Cloud Kerberos trust is preferred over certificate trust because it needs no per-device
  certificate deployment.
