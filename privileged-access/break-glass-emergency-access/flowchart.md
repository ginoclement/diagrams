---
title: "Break-Glass Emergency Access — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Break-Glass Emergency Access — Decision Flowchart

The authorization, alerting, and mandatory-reseal gates, with explicit deny and
containment terminals. Note that alerting is unconditional.

```mermaid
flowchart TD
    S(["Responder invokes break-glass"]) --> Alert["Fire HIGH alert,<br/>page security + leadership"]
    Alert --> Incident{"Matching declared<br/>incident on record?"}
    Incident -->|No| Contain(["Containment: treat as attack,<br/>block and escalate"])
    Incident -->|Yes| Mode{"Multi-person control<br/>available?"}

    Mode -->|"Yes - M-of-N"| Quorum{"Quorum of custodian<br/>parts supplied?"}
    Quorum -->|No| DenyQuorum(["Deny: insufficient custodians"])
    Quorum -->|Yes| Open["Reassemble sealed credential"]

    Mode -->|"No - documented<br/>solo override"| Solo["Escalate to CRITICAL,<br/>flag retroactive review"]
    Solo --> Open

    Open --> Path{"Normal login path<br/>available?"}
    Path -->|Yes| Sign["Sign in as emergency account"]
    Path -->|"No - IdP down"| OOB["Use out-of-band /<br/>cloud-only emergency account"]
    OOB --> Sign

    Sign --> Use["Perform emergency remediation<br/>(fully recorded)"]
    Use --> End["End emergency access"]
    End --> Reseal{"Rotate secret,<br/>re-split and re-seal?"}
    Reseal -->|Success| Review(["Resealed: post-use review<br/>ticket opened"])
    Reseal -->|Failure| Quar(["Error: account quarantined<br/>until resealed"])
```

Notes

- The alert step has no branch out of it — every invocation is loud, whether or not it is
  later authorized, so the abuse path in `Incident -->|No|` is still noisy.
- The solo-override branch is not a shortcut: it raises the alert severity and forces a
  retroactive review, trading prevention for even stronger detection.
- The reseal gate fails closed: a credential that could not be re-sealed leaves the
  account quarantined rather than silently reusable.
