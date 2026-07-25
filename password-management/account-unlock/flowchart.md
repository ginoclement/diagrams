---
title: "Account Unlock — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Account Unlock — Decision Flowchart

Branch-focused view: detect lockout, auto-unlock after cool-down, identity proof for
manual unlock, repeated-lockout escalation, and the unlock-vs-reset decision.

```mermaid
flowchart TD
    Start(["Login attempt"]) --> Locked{"Account locked?"}
    Locked -->|no| Normal(["Proceed with<br/>normal login"])
    Locked -->|yes| Cooldown{"Cool-down elapsed?"}

    Cooldown -->|yes| Auto["Auto-clear lock,<br/>reset counter"] --> Normal
    Cooldown -->|no| Repeat{"Repeated lockout<br/>in short window?"}

    Repeat -->|yes| Escalate["Raise security alert,<br/>apply exponential backoff"]
    Escalate --> ForceReset(["Require MFA-backed reset,<br/>not a simple unlock"])

    Repeat -->|no| Prove{"Identity proven?<br/>(MFA / recovery factor)"}
    Prove -->|no| EDeny(["Deny:<br/>verification failed,<br/>stays locked"])
    Prove -->|yes| Compromise{"Compromise suspected?"}

    Compromise -->|yes| ResetToo["Unlock AND force<br/>password reset"] --> Reset(["Unlocked, new<br/>password required"])
    Compromise -->|no| Unlock["Clear lock,<br/>reset failure counter"]
    Unlock --> Done(["Unlocked:<br/>sign in with existing password"])
```
