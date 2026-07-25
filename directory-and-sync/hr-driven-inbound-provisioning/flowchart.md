---
title: "HR-Driven Inbound Provisioning — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# HR-Driven Inbound Provisioning — Decision Flowchart

Per-record decision logic from HR delta to lifecycle action, with explicit quarantine and
error terminals.

```mermaid
flowchart TD
    START(["HR delta record received"]) --> SCOPE{"Worker in<br/>provisioning scope?"}
    SCOPE -->|"no"| SKIP(["No action, skip record"])
    SCOPE -->|"yes"| REQ{"Required attributes<br/>present and mappable?"}
    REQ -->|"no"| ERAttr(["Quarantine: missing / bad attribute"])
    REQ -->|"yes"| MATCH{"Anchor matches<br/>existing accounts?"}

    MATCH -->|"multiple / ambiguous"| ERDup(["Quarantine: ambiguous match,<br/>manual review"])
    MATCH -->|"none"| HIRE{"Effective hire<br/>date reached?"}
    HIRE -->|"no"| PRE(["Hold as pre-hire / staged"])
    HIRE -->|"yes"| CREATE["Create account (Joiner)"]
    CREATE --> ONB(["Trigger onboarding"])

    MATCH -->|"exactly one"| STATE{"HR worker<br/>status?"}
    STATE -->|"terminated (date reached)"| DISABLE["Disable / deprovision (Leaver)"]
    DISABLE --> REVOKE(["Revoke downstream access"])
    STATE -->|"active, attributes changed"| UPDATE["Update attributes (Mover)"]
    UPDATE --> REGRP(["Re-evaluate groups / entitlements"])
    STATE -->|"active, no change"| NOOP(["No-op, already in sync"])

    CREATE -.->|"write fails"| ERWrite(["Error: directory write failed,<br/>retry / alert"])
    UPDATE -.->|"write fails"| ERWrite
    DISABLE -.->|"write fails"| ERWrite
```

Notes

- Scope and attribute validation gate every record before any match is attempted, so bad or
  irrelevant data never reaches the directory.
- A missing match is a Joiner but only fires at the effective hire date; a single match
  routes on HR status into Mover, Leaver, or no-op.
- Directory write failures are surfaced as a retry/alert terminal rather than silently
  dropped — a failed Leaver disable is standing access risk.
