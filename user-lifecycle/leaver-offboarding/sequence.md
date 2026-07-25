---
title: "Leaver — Offboarding Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Leaver — Offboarding Sequence Diagram

Happy path first (standard notice-period termination in ordered steps), then for-cause
instant kill, rehire re-enable, and orphaned-account cleanup alternates.

```mermaid
sequenceDiagram
    autonumber
    participant HR as HR / Source of Truth
    participant IGA as IGA Engine
    participant IdP as IdP / Directory
    participant App as Downstream App
    actor IT

    %% --- Happy path ---
    HR->>IGA: Termination event<br/>(worker_id, effective date, standard notice)
    IGA->>IdP: Disable account (active=false)
    IdP-->>IGA: 200 OK - new logins blocked
    IGA->>IdP: Revoke active sessions + OAuth tokens
    IdP-->>IGA: Sessions and refresh tokens invalidated

    par Deprovision downstream apps
        IGA->>App: SCIM DELETE /Users (or active=false)
        App-->>IGA: 204 No Content
    end

    IGA->>IT: Reclaim licenses, collect / wipe devices
    IT-->>IGA: Seats freed, device wiped
    IGA->>IT: Archive mailbox + files, transfer ownership to manager
    IT-->>IGA: Data archived / transferred

    Note over IGA,IdP: Account kept disabled through the retention window
    IGA->>IGA: Retention timer expires
    IGA->>IdP: Hard-delete account
    IGA->>App: Purge residual data per policy

    %% --- Alternates ---
    alt For-cause / immediate instant kill
        HR->>IGA: Termination event (for_cause=true, effective now)
        par Immediate access kill
            IGA->>IdP: Disable account NOW
            IGA->>IdP: Revoke ALL sessions + tokens NOW
        end
        Note over IGA,App: Deprovision, reclaim, archive follow<br/>right after - no notice-period delay
    else Rehire re-enable within retention window
        HR->>IGA: New worker event matches a disabled prior identity
        IGA->>IGA: Uniqueness match to retained account
        IGA->>IdP: Re-enable account (active=true)
        Note over IGA,App: Re-run birthright provisioning for the new role,<br/>see joiner-onboarding
    end

    opt Orphaned-account cleanup
        IGA->>IGA: Reconcile IdP accounts vs active HR records
        alt Account has no matching active worker
            IGA->>IT: Flag orphan for owner confirmation
            alt Confirmed orphan
                IGA->>IdP: Disable + schedule deletion
            else Legitimate (service / shared)
                IGA->>IGA: Tag as exception, assign owner
            end
        end
    end
```

Notes

- Disable and token/session revocation come first and, in the for-cause path, run in
  parallel — the goal is to stop access in seconds, then clean up over minutes/hours.
- Deletion is deferred until the retention window closes, because legal hold, payroll, and
  audit may still need the record.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
