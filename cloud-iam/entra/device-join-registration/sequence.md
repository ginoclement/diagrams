# Device Join and Registration — Sequence Diagram

Happy path first (Entra Join with TPM attestation), then Entra Registered (BYOD), Hybrid
Join via the SCP, and an attestation-unavailable fallback.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Dev as Device
    participant TPM as TPM
    participant DRS as DRS
    participant Entra as Entra
    participant AD as ADDS

    User->>Dev: Start Entra Join (Out-of-box / Settings)
    Dev->>Entra: Discover DRS endpoint, authenticate user
    Entra-->>Dev: User token for device registration
    Dev->>TPM: Generate device key pair
    TPM-->>Dev: Public key + attestation statement
    Dev->>DRS: POST device registration<br/>(public key, attestation, hardware IDs)
    DRS->>Entra: Create device object, mark TPM-attested
    DRS-->>Dev: Device certificate + device object ID
    Dev->>TPM: Store device cert private key
    Dev-->>User: Joined - PRT can now be issued

    alt Entra Registered (BYOD)
        User->>Dev: Add work account (workplace join)
        Dev->>DRS: Register device under user, no full join
        DRS-->>Dev: Device object (registered), device cert
        Note over Dev,Entra: User keeps personal/local primary sign-in,<br/>device satisfies device-based CA only
    else Hybrid Join (domain-joined + Entra)
        Dev->>AD: Read Service Connection Point (SCP)
        AD-->>Dev: Entra tenant + DRS discovery info
        Dev->>DRS: Register using computer identity (cert-based)
        DRS->>Entra: Create hybrid device object
        Note over AD,Entra: Entra Connect syncs the device object,<br/>enabling cloud + on-prem SSO
    else TPM attestation unavailable
        Dev->>DRS: Register with software-protected key<br/>(no attestation statement)
        DRS-->>Dev: Device object flagged not attested
        Note over DRS,Entra: Weaker binding, some CA policies<br/>may require attested/compliant devices
    end
```

Notes

- Attestation lets Entra trust the key is TPM-bound, commas separate the list items in
  these notes so the diagram parses.
- Hybrid Join keys off the on-prem SCP written by Entra Connect, without it, domain
  devices never discover the right tenant.
- After any successful registration the device can obtain a PRT and be targeted by Intune
  compliance policies.
