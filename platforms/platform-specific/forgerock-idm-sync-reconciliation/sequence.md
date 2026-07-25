---
title: "ForgeRock IDM — Sync & Reconciliation Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ForgeRock IDM — Sync & Reconciliation Sequence Diagram

Happy path shows both mechanisms: **implicit sync** pushes a single change out
immediately, while a **scheduled reconciliation** sweeps all objects, computes a
**situation** per object, and runs the mapped action. Alternates: liveSync inbound
polling, deprovision on `UNQUALIFIED`.

```mermaid
sequenceDiagram
    autonumber
    participant Source as Source (HR / repo)
    participant IDM
    participant DS as DS (repo)
    participant Target as Target resource

    %% ----- implicit sync on change -----
    Source->>IDM: Object change (create / update / delete)
    IDM->>DS: Persist managed object + link state
    IDM->>IDM: Run mapping onCreate/onUpdate,<br/>apply attribute transforms
    IDM->>Target: Push mapped change via connector
    Target-->>IDM: Ack (target object created / updated)
    IDM->>DS: Update link (source id to target id)
    Note over IDM,Target: Implicit sync keeps targets current between recons

    %% ----- scheduled reconciliation -----
    IDM->>IDM: Scheduler fires reconciliation for a mapping
    IDM->>Source: Query all source objects
    IDM->>Target: Query all target objects
    IDM->>IDM: Correlate + compute situation per object
    loop Each correlated object
        alt CONFIRMED
            IDM->>IDM: Linked and in sync - default no-op / update
        else ABSENT (qualifies, no target)
            IDM->>Target: CREATE target account, establish link
        else MISSING (link exists, target gone)
            IDM->>DS: Flag link, run MISSING action (unlink / recreate)
        else UNQUALIFIED (no longer qualifies)
            IDM->>Target: DELETE / disable target (deprovision)
            IDM->>DS: Remove link
        else UNASSIGNED (orphan target, no source)
            IDM->>Target: Run UNASSIGNED action (report / delete)
        end
    end
    IDM->>DS: Write reconciliation summary + per-object results
    IDM-->>Source: Recon run complete

    %% ----- alternates -----
    alt liveSync (inbound polling)
        IDM->>Target: Poll change log / cookie since last run
        Target-->>IDM: Changed entries since cookie
        IDM->>IDM: Apply inbound mapping for each change
        IDM->>DS: Update managed objects + links, advance cookie
    end

    opt Deprovision on UNQUALIFIED (leaver)
        Source->>IDM: User set inactive / removed from source
        IDM->>IDM: Recon marks account UNQUALIFIED
        IDM->>Target: Disable / delete account
        IDM->>DS: Break link, record deprovision
    end
```
