---
title: "Secrets Broker with Dynamic Credentials — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Broker with Dynamic Credentials — Sequence Diagram

Happy path first (authenticate, mint a leased short-lived credential, use it, auto-revoke
at expiry), then lease renewal, early revoke, and policy-denial alternates.

```mermaid
sequenceDiagram
    autonumber
    participant Cli as Client
    participant Brk as Broker
    participant Bak as Backend
    participant Res as Resource

    Cli->>Brk: Authenticate with workload identity (JWT / IAM / SPIFFE)
    Brk->>Brk: Verify identity + evaluate role policy
    Brk->>Bak: Create ephemeral principal (DB user / STS keys) with scoped grants
    Bak-->>Brk: Ephemeral credential created
    Brk-->>Cli: Return credential + lease id + TTL

    Cli->>Res: Connect using minted credential
    Res-->>Cli: Access within granted scope

    opt Renew before expiry
        Cli->>Brk: Renew lease (lease id)
        Brk->>Brk: Extend TTL up to max TTL
        Brk-->>Cli: Lease extended (or capped at max TTL)
    end

    Note over Brk,Bak: TTL elapses

    Brk->>Bak: Revoke ephemeral principal at expiry
    Bak-->>Brk: Principal deleted - credential now invalid
    Brk-->>Cli: Lease expired (renew impossible past max TTL)

    alt Early revoke (operator / breach response)
        Brk->>Bak: Revoke lease now (before TTL)
        Bak-->>Brk: Ephemeral principal deleted
        Res--xCli: Subsequent calls rejected - credential dead
    end

    alt Policy denies the request
        Brk-->>Cli: Deny - identity not entitled to role
        Note over Brk,Bak: No ephemeral principal ever created
    end
```

Notes

- The broker authenticates the **workload**, not a human, the whole flow is machine-to-service
  and no operator ever handles the secret.
- The credential exists only between the backend `create` and its matching `revoke`, so the
  lease + TTL, not rotation, is what bounds exposure.
- Auto-revoke at expiry fires from the broker's own timer with no client turn, which is the
  property that guarantees no orphaned standing credential.
