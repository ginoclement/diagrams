---
title: "Credential Recovery by Persona — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Credential Recovery by Persona — Sequence Diagram

The persona is resolved first, then each `alt` branch shows how that persona recovers access.
Branches reference their base flow rather than redrawing it.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Portal as Portal / Console
    participant IdP as IdP / Directory
    participant Helpdesk as Helpdesk
    participant Vault as PAM Vault
    participant Issuer as CA / Secret mgr

    Note over Portal,IdP: Resolve persona from account type

    alt Consumer (self-service reset)
        User->>Portal: Start password reset
        Portal->>IdP: Look up recovery factors
        IdP->>User: Challenge recovery factor<br/>(email / SMS / passkey)
        User->>IdP: Prove control of factor
        IdP-->>Portal: Verified, allow new password
        User->>Portal: Set new password
        Portal-->>User: Access restored
    else Workforce (SSPR or helpdesk fallback)
        User->>Portal: Start reset
        alt Enough factors registered
            Portal->>IdP: Verify registered MFA factors
            IdP-->>Portal: Verified
            User->>Portal: Set new password
        else Factors insufficient / locked out
            User->>Helpdesk: Request assisted reset
            Helpdesk->>Helpdesk: Identity proofing<br/>(manager callback, ID check)
            Helpdesk->>IdP: Issue one-time code, force change
            IdP-->>User: Temp credential, must change at next login
        end
        Portal-->>User: Access restored
    else Privileged (vaulted, no self-reset)
        User->>Vault: Request checkout / rotation<br/>(no direct account reset)
        Vault->>Vault: Approval + SoD check, set expiry
        Vault->>IdP: Rotate vaulted credential
        Vault-->>User: Time-boxed checkout of new secret<br/>(session recorded)
    else Workload (rotate keys / certs)
        Issuer->>Issuer: Detect compromise / expiry
        Note over Issuer: No password, no human reset
        Issuer->>IdP: Revoke old key / certificate
        Issuer->>Issuer: Re-attest, issue new keypair / cert
        Issuer-->>User: New credential provisioned to workload
    end
```

Notes

- The consumer and workforce paths converge on "set a new password", but the workforce path
  adds a **proofed helpdesk fallback** that the consumer path deliberately lacks.
- Privileged recovery is **not** a reset: the holder never learns a resettable password; the
  vault rotates and checks out the secret under approval and recording.
- The workload branch has no `User`-driven step and no password — recovery is revoke-and-reissue
  bound to attestation.

Related: [README](./README.md) | [Swimlane](./swimlane.md) | [Flowchart](./flowchart.md)
