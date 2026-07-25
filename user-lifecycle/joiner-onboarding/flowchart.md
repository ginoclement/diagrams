---
title: "Joiner — Onboarding Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Joiner — Onboarding Decision Flowchart

Provisioning decision logic from HR event to active account, with explicit terminals for
approval rejection and exhausted retries.

```mermaid
flowchart TD
    S([HR worker event received]) --> A{"Uniqueness match:<br/>existing person record?"}
    A -->|yes, rehire| R([Route to rehire re-enable<br/>- see leaver-offboarding])
    A -->|no, new person| B["Create authoritative identity"]

    B --> C{"Worker type?"}
    C -->|full-time / standard| D["Standard birthright + RBAC set"]
    C -->|contingent / contractor| E["Contingent birthright set<br/>+ hard end date"]

    D --> F{"Start date reached?"}
    E --> F
    F -->|future date| G(["Create staged account<br/>active=false, wait for start"])
    F -->|today or past| H["Create account in IdP"]

    H --> I{"Any privileged<br/>birthright entitlement?"}
    I -->|yes| J{"Manager / owner<br/>approves?"}
    J -->|no| K(["Skip privileged grant,<br/>log decision"])
    J -->|yes| L["Include privileged entitlement"]
    I -->|no| L2["Baseline birthright only"]

    K --> M
    L --> M
    L2 --> M["Provision downstream apps<br/>(SCIM POST /Users)"]

    M --> N{"App provisioning<br/>succeeded?"}
    N -->|yes| P["Activate account, issue credentials"]
    N -->|transient error| Q{"Retry budget<br/>remaining?"}
    Q -->|yes| M
    Q -->|no| Z([Remediation task raised -<br/>manual provisioning required])

    P --> OK([Account active - day-one access ready])
```

Notes

- A uniqueness hit on an existing record is treated as a **rehire**, not a new joiner —
  it diverts to the [leaver](../leaver-offboarding/README.md) re-enable path to avoid
  orphaned duplicate accounts.
- Retries are bounded; exhaustion produces a human task rather than silently dropping the
  provisioning.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
