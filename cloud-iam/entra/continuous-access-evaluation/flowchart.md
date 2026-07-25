---
title: "Continuous Access Evaluation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Continuous Access Evaluation — Decision Flowchart

Whether a CAE-capable resource accepts a token or issues a claims challenge, and how
re-evaluation resolves. Deny paths terminate explicitly.

```mermaid
flowchart TD
    Start(["Client calls resource with CAE token"]) --> Aware{"Client + resource<br/>CAE-capable?"}
    Aware -->|No| Standard(["Standard token lifetime<br/>revocation waits for expiry"])
    Aware -->|Yes| Event{"Critical event<br/>signaled for this token?"}

    Event -->|No| Loc{"Call from an<br/>allowed location?"}
    Loc -->|Yes| Serve(["200 - serve resource"])
    Loc -->|No| Challenge
    Event -->|Yes| Challenge["401 claims challenge<br/>error=insufficient_claims"]

    Challenge --> Reeval["Client re-requests token<br/>with claims challenge"]
    Reeval --> State{"Re-evaluate current state"}
    State -->|"Account disabled"| DenyDisabled(["Deny: account disabled"])
    State -->|"Sessions revoked"| DenyRevoke(["Deny: session revoked"])
    State -->|"Risk elevated"| Risk{"Risk remediated<br/>via MFA?"}
    Risk -->|No| DenyRisk(["Deny: risk not remediated"])
    Risk -->|Yes| Issue
    State -->|"CA policy changed"| Policy{"New CA controls<br/>satisfied?"}
    Policy -->|No| DenyPolicy(["Deny: new policy unmet"])
    Policy -->|Yes| Issue
    State -->|"Location now allowed"| Issue["Issue fresh token"]

    Issue --> Serve
```

Notes

- Non-CAE-aware clients fall back to standard token expiry — they gain nothing from CAE but
  are not broken by it.
- Every re-evaluation branch is fail-closed: the client only gets a fresh token when the
  current state actually satisfies policy.
- CAE reduces the revocation window from ~1 token lifetime to minutes, which is why CAE
  tokens can safely be long-lived.
