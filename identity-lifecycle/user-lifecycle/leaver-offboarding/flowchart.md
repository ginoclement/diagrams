---
title: "Leaver — Offboarding Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Leaver — Offboarding Decision Flowchart

Teardown decision logic with the for-cause fast path, the rehire branch, and the retention
gate before deletion.

```mermaid
flowchart TD
    S([Termination event]) --> A{"Rehire match to a<br/>disabled prior identity?"}
    A -->|yes, within window| R([Re-enable account -<br/>rerun birthright, see joiner])
    A -->|no| B{"For cause /<br/>immediate?"}

    B -->|yes| C["Disable account + revoke ALL<br/>sessions and tokens NOW (parallel)"]
    B -->|no, standard notice| D["Disable account (active=false)"]
    D --> E["Revoke active sessions + tokens"]
    C --> F
    E --> F["Deprovision downstream apps<br/>(SCIM DELETE / active=false)"]

    F --> G["Reclaim licenses, wipe / collect devices"]
    G --> H{"Data needs archive<br/>or transfer?"}
    H -->|yes| I["Archive mailbox + files,<br/>transfer ownership to manager"]
    H -->|no| J["Skip archive"]
    I --> K
    J --> K{"Retention window<br/>elapsed?"}
    K -->|no| W([Account stays disabled -<br/>legal hold / audit retention])
    K -->|yes| L["Hard-delete account + purge residual data"]
    L --> OK([Identity fully removed])

    Z([Reconciliation: account with<br/>no active HR record]) --> M{"Confirmed orphan?"}
    M -->|yes| D
    M -->|no, service / shared| N([Tag as exception, assign owner])
```

Notes

- The for-cause branch collapses disable and revoke into one immediate parallel action;
  the standard path does them in sequence but still before any app cleanup.
- Deletion never happens on the termination event itself — the retention gate defers it,
  and legal hold can pin the account indefinitely.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
