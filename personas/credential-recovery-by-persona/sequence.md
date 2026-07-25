# Credential Recovery by Persona — Sequence Diagram

Each `alt` branch shows what "recovery" means for that persona — reset, assisted reset,
vaulted rotation, or credential re-issue. Base reset mechanics are in the linked diagrams.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant IdP as IdP
    participant Helpdesk as Helpdesk
    participant Vault as Vault / PAM
    actor Owner

    alt Consumer (SSPR only)
        User->>IdP: Start reset (identifier)
        IdP->>User: Verify recovery channel (email / phone / passkey)
        User->>IdP: Prove control of channel
        IdP->>IdP: Verify, enforce policy
        IdP-->>User: Set new credential, done
    else Workforce (SSPR plus helpdesk fallback)
        User->>IdP: Start self-service reset
        alt Self-service succeeds
            IdP->>User: Verify registered factor
            User->>IdP: Prove factor
            IdP-->>User: Set new credential
        else All factors lost / locked out
            User->>Helpdesk: Request assisted recovery
            Helpdesk->>Helpdesk: Scripted identity proofing, out-of-band check
            Helpdesk->>IdP: Reset / re-enrol on verified identity (see admin-initiated reset)
            IdP-->>User: Temporary credential, force change plus re-enrol factor
        end
    else Privileged (vaulted, no direct reset)
        User->>Vault: Request check-out of privileged credential
        Vault->>Vault: Authorize (approval / SoD), log
        Vault-->>User: Broker session or one-time secret (time-boxed)
        Note over User,Vault: User never holds a standing secret
        User->>Vault: Check-in when done
        Vault->>Vault: Rotate credential immediately
    else Workload (rotate keys / certs)
        Owner->>IdP: Request new secret / certificate
        IdP-->>Owner: Issue new credential (overlap window)
        Owner->>Owner: Deploy new credential to consumers
        Owner->>IdP: Revoke old credential after cutover
    end
```

Notes

- Consumer has exactly one path; the absence of a helpdesk is the fork.
- Privileged never resets a user-held secret — check-out and post-use rotation replace
  "recovery" entirely, so a lost secret is a non-event.
- Workload "recovery" is overlap-safe rotation: issue new, cut over, then revoke old — reversing
  that order causes an outage rather than a recovery.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
