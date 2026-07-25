# Impossible Travel / Anomalous Session — Sequence Diagram

Happy path first (feasible travel, allowed), then the impossible-travel step-up, the
high-confidence block-and-revoke, the step-up-failure, and the VPN false-positive
alternates.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant IdP as IdP
    participant Det as Detection
    participant Geo as GeoIP
    participant Enf as Enforcement

    User->>IdP: Sign-in event A (location A, time t1)
    IdP->>Geo: Resolve location + ASN / VPN for event A
    Geo-->>IdP: Location A
    Note over IdP,Det: Later, a second event arrives

    User->>IdP: Sign-in / activity event B (location B, time t2)
    IdP->>Geo: Resolve location + ASN / VPN for event B
    Geo-->>IdP: Location B
    IdP->>Det: Evaluate travel (distance A to B over t2 - t1)
    Det-->>IdP: Velocity feasible - no anomaly

    alt Feasible travel - allow
        IdP-->>User: Continue - session allowed
    else Impossible travel - step-up
        Det-->>IdP: Velocity infeasible - anomaly (medium)
        IdP->>Enf: Require re-authentication
        Enf->>User: Step-up challenge (prefer FIDO2 / passkey)
        User->>Enf: Complete step-up
        Enf-->>IdP: Re-verified - clear anomaly, continue
    else High-confidence anomaly - block + revoke
        Det-->>IdP: Infeasible travel + hard signal (known-bad IP / leaked cred)
        IdP->>Enf: Revoke active sessions, block
        Enf-->>User: Access denied - alert raised
    end

    opt Step-up fails or abandoned
        User--xEnf: Cannot re-verify
        Enf->>IdP: Revoke session
        IdP-->>User: Blocked
    end

    opt False positive (VPN / known travel)
        Geo-->>Det: Event B egress is corporate VPN / allowlisted
        Det-->>IdP: Downgrade or clear anomaly
    end
```

Notes

- The engine needs **two** events to compute velocity, the anomaly is a property of the pair
  (distance over elapsed time), not of either sign-in alone.
- A satisfied step-up **clears** the anomaly and continues, while a failure routes to revoke,
  the policy fails closed rather than leaving a suspicious session live.
- VPN and known-travel context (the last `opt`) is applied before blocking, so a corporate
  egress hop does not masquerade as an attacker on the other side of the world.
