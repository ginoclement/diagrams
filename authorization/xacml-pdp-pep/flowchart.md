---
title: "XACML — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# XACML — Decision Flowchart

Policy evaluation from Target matching through the combining algorithm to the four XACML decisions,
then the PEP's obligation and default handling. Deny terminals are explicit.

```mermaid
flowchart TD
    Start(["PEP forms XACML request context"]) --> Target{"Any policy Target<br/>matches the request?"}
    Target -->|No| NA["Decision = NotApplicable"]
    Target -->|Yes| Attrs{"All attributes needed<br/>by conditions available?"}

    Attrs -->|No| Pip{"PIP resolves them?"}
    Pip -->|No| Indet["Decision = Indeterminate"]
    Pip -->|Yes| Eval
    Attrs -->|Yes| Eval["Evaluate matching rules<br/>(Effect Permit/Deny + Condition)"]

    Eval --> Combine{"Combining algorithm<br/>resolves conflicts"}
    Combine -->|"a Deny wins<br/>(deny-overrides)"| DenyDec["Decision = Deny"]
    Combine -->|"a Permit wins"| PermitDec["Decision = Permit"]

    NA --> PepDefault
    Indet --> PepDefault
    DenyDec --> PepDeny(["PEP: 403 Deny"])

    PepDefault{"PEP default for<br/>NotApplicable / Indeterminate"} -->|"deny (recommended)"| PepDeny

    PermitDec --> Obl{"Permit carries<br/>obligations?"}
    Obl -->|No| Grant(["PEP: grant access"])
    Obl -->|Yes| Fulfil{"PEP can fulfill<br/>all obligations?"}
    Fulfil -->|No| PepDeny
    Fulfil -->|Yes| DoObl["Execute obligations<br/>(log, notify)"] --> Grant
```

Notes

- **Four decisions, not two**: Permit, Deny, NotApplicable, Indeterminate. Only the PEP turns them
  into allow/deny, and the safe default for the latter two is **deny**.
- The **combining algorithm** (deny-overrides, permit-overrides, first-applicable, and their
  `*-unless-*` variants) is where multiple matching rules/policies are reconciled — choose it
  deliberately.
- The **obligation gate** makes Permit conditional: an unfulfillable obligation converts a Permit
  into a deny. Advice, by contrast, never blocks the grant.
