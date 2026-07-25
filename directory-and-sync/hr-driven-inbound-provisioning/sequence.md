---
title: "HR-Driven Inbound Provisioning — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HR-Driven Inbound Provisioning — Sequence Diagram

Happy path first (new worker becomes a created account), then Mover updates, Leaver
disable, out-of-scope skip, and quarantine on a mapping/validation error.

```mermaid
sequenceDiagram
    autonumber
    participant HR as HR (source of record)
    participant Prov as Provisioning engine
    participant Dir as Directory (target)
    participant Down as Downstream apps / groups

    Prov->>HR: Connect, request worker delta since watermark
    HR-->>Prov: Changed worker records
    loop For each worker record
        Prov->>Prov: Apply scoping filter (in scope?)
        Prov->>Prov: Apply attribute mapping + transforms<br/>(build UPN, displayName, manager ref)
        Prov->>Dir: Match by anchor (employeeID)
        Dir-->>Prov: No matching account (new worker)

        alt Joiner (effective hire date reached)
            Prov->>Dir: Create account with mapped attributes
            Dir-->>Prov: Account created
            Prov->>Down: Trigger onboarding, see joiner-onboarding
            Down-->>Prov: Provisioning started
        else Mover (existing match, attributes changed)
            Prov->>Dir: Update changed attributes<br/>(department, title, manager)
            Dir-->>Prov: Account updated
            Prov->>Down: Re-evaluate groups / entitlements
        else Leaver (termination date reached)
            Prov->>Dir: Disable / deprovision account
            Dir-->>Prov: Account disabled
            Prov->>Down: Revoke downstream access
        else Out of scope
            Prov->>Prov: Skip record, no action
        else Mapping / validation error
            Prov->>Prov: Quarantine record (missing required attr),<br/>report for review
        end
    end
    Prov->>Prov: Advance watermark, write audit log
```

Notes

- The engine pulls a delta since the last watermark, so a run touches only workers whose HR
  record changed, then advances the watermark once the batch completes.
- Creation, update, and disable are timed to HR effective dates (hire, change, termination),
  not to when the sync happens to run.
- A record that cannot be mapped or matched cleanly is quarantined and reported rather than
  guessed, so one bad worker record does not corrupt or stall the rest of the batch.
