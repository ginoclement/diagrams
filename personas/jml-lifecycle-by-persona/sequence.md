# JML Lifecycle by Persona — Sequence Diagram

The mastering authority differs per persona, so each `alt` branch starts from a different
`Source` and ends in a different terminal semantic (delete, expire, revoke, or decommission).

```mermaid
sequenceDiagram
    autonumber
    participant Source as Source of Truth
    participant IGA as IGA Engine
    participant IdP as IdP / Directory
    participant App as Downstream App
    actor Owner

    alt Employee (HR-driven)
        Note over Source,App: See joiner-onboarding / mover-role-change / leaver-offboarding
        Source->>IGA: HR event (hire / change / termination)
        IGA->>IGA: Re-evaluate access from attributes plus policy
        IGA->>IdP: Create / update / disable account
        IGA->>App: Provision or deprovision (SCIM)
        opt Termination
            IGA->>App: Deprovision, then delete after retention
        end
    else Contractor (sponsor plus hard expiry)
        Source->>IGA: Sponsor creates identity with end date
        IGA->>IdP: Create account with hard expiry attribute
        IGA->>App: Provision scoped, least-privilege access
        alt Expiry reached and no extension
            IGA->>IdP: Auto-disable at hard expiry
            IGA->>App: Deprovision
        else Sponsor re-attests before expiry
            Source->>IGA: Extend end date (re-verify need)
            IGA->>IdP: Update expiry
        end
    else Partner / B2B (external org, no local mastering)
        Source->>IGA: Invitation accepted (external identity linked)
        IGA->>IdP: Create external-user shell (no credential mastered)
        IGA->>App: Grant boundary-scoped access
        alt Partner offboards user or invite expires
            Source->>IGA: Trust signal lost / expiry
            IGA->>IdP: Revoke external shell, drop federation link
            IGA->>App: Deprovision boundary access
        end
        Note over Source,IGA: No local mover / leaver events, external org owns those
    else Workload (owner-attested)
        Owner->>IGA: Register workload, attest need
        IGA->>IdP: Create client / service identity
        IGA->>App: Bind scopes / entitlements to client
        loop Rotation (not mover)
            IGA->>IdP: Rotate secret / certificate on schedule
        end
        alt Decommission (not leaver)
            Owner->>IGA: Decommission request
            IGA->>IdP: Revoke credentials, remove client
            IGA->>App: Remove entitlements
        end
    end

    opt Reconciliation sweep (all personas)
        IGA->>IdP: Read actual accounts / clients
        IGA->>App: Read actual entitlements
        IGA->>IGA: Compare target vs actual, remediate drift plus orphans
    end
```

Notes

- Only the Employee branch has a natural "termination" signal. Contractor relies on a **hard
  expiry**, Partner on an **external trust signal**, Workload on an **owner decision** — three
  different ways of guaranteeing the identity eventually ends.
- Workload has a `loop` (rotation) where humans have a mover, and a `decommission` where
  humans have a leaver — the vocabulary itself forks.
- The reconciliation sweep is shared and is the safety net wherever the per-persona end signal
  is unreliable.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
