---
title: "Access Review & Certification — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Access Review & Certification — Decision Flowchart

Per-item decision logic from assignment through the deadline, with explicit terminals for
certified-kept and revoked-and-deprovisioned outcomes.

```mermaid
flowchart TD
    S([Campaign generated,<br/>items assigned]) --> A{"Reviewer knows<br/>this access?"}
    A -->|no| B["Delegate item to a<br/>more knowledgeable owner"]
    B --> A
    A -->|yes| C{"Decision made<br/>before deadline?"}

    C -->|no| D["No-response policy applies"]
    D --> E{"Policy = auto-revoke?"}
    E -->|yes| R
    E -->|no, auto-certify| K([Kept by default -<br/>weak posture, flagged])

    C -->|yes| F{"Access still<br/>justified?"}
    F -->|yes| G["Certify (record signed approval)"]
    G --> OK([Access kept - audit evidence stored])
    F -->|no| R["Revoke -> queue remediation"]

    R --> H["Remove group membership (IdP)"]
    H --> I["Deprovision entitlement (SCIM to app)"]
    I --> DONE([Access removed])
```

Notes

- A reviewer who does not recognize an access item should delegate, not guess-certify —
  blind certification is the main way certifications fail as a control.
- The auto-revoke branch is the recommended no-response policy; auto-certify exists but is
  flagged as a weak posture because it lets access persist unattested.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
