---
title: "Credential Vault Check-Out / Check-In — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Credential Vault Check-Out / Check-In — Sequence Diagram

Happy path first (brokered check-out, session, check-in with rotation), then alternates:
approval-required, reveal model, exclusive-lock contention, auto check-in on timeout, and
rotation failure.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant PAM as PAM (vault + broker)
    participant Approver
    participant Dir as Directory
    participant Target

    User->>PAM: Authenticate (SSO + phishing-resistant MFA)
    PAM->>Dir: Verify identity and group membership
    Dir-->>PAM: Authenticated, entitlements returned
    User->>PAM: Request check-out of privileged account on Target
    PAM->>PAM: Check entitlement, policy, and availability lock

    alt Policy requires approval
        PAM->>Approver: Notify - approval request (who, target, reason, window)
        Approver-->>PAM: Approve (time-boxed)
    end

    PAM->>PAM: Acquire exclusive lock, open lease with TTL
    Note over User,Target: Brokered model - the secret is never shown to the human

    PAM->>Target: Open proxied session, inject credential
    Target-->>PAM: Privileged session established
    PAM-->>User: Connected session (recorded), password hidden
    User->>Target: Perform administrative work (via PAM proxy)

    User->>PAM: Check in (end session)
    PAM->>Target: Close session
    PAM->>Dir: Rotate account password to new random value
    Dir-->>PAM: Rotation succeeded, new value stored in vault
    PAM->>PAM: Release lock, close lease, write audit record
    PAM-->>User: Checked in, credential rotated

    alt Reveal model (no brokering possible)
        PAM-->>User: Display / copy password for bounded window
        Note over PAM,User: On check-in the shown value is treated as burned<br/>and rotated immediately
    end

    alt Exclusive lock already held
        PAM-->>User: Denied - account in use by another admin,<br/>offer queue or notify-on-release
    end

    alt Session abandoned past TTL
        PAM->>PAM: Lease expires - force auto check-in
        PAM->>Target: Terminate session
        PAM->>Dir: Rotate password
    end

    alt Rotation fails at check-in
        PAM->>Dir: Rotate password
        Dir-->>PAM: Error - target unreachable / rotation rejected
        PAM->>PAM: Quarantine account, alert admin,<br/>do NOT return old value to available pool
    end
```

Notes

- The exclusive lock (steps around lock acquisition) is what preserves one-human
  accountability for a shared account; concurrent mode drops the lock but attributes
  each session separately.
- In the brokered branch the credential travels PAM to Target only; the User channel
  never carries the secret, which is the main advantage over the reveal model.
- Rotation is the security-critical step: a failed rotation must fail *closed*
  (quarantine), never fall back to leaving the old password valid and available.
