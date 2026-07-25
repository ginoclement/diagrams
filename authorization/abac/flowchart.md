---
title: "ABAC — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ABAC — Decision Flowchart

Attribute gathering, policy matching, condition evaluation, and combining-algorithm resolution.
Deny and Indeterminate terminals are explicit.

```mermaid
flowchart TD
    Start(["Request: subject, action, resource"]) --> Gather["Gather subject/resource/action/env<br/>attributes from token + request"]
    Gather --> Applic{"Any policy<br/>applicable to this<br/>subject/action/resource?"}
    Applic -->|No| DefDeny(["Deny by default<br/>(no applicable policy)"])
    Applic -->|Yes| Have{"All attributes needed<br/>by the policy present?"}

    Have -->|No| Pip{"PIP can resolve<br/>the missing attribute?"}
    Pip -->|No| Indet(["Indeterminate -> Deny<br/>(attribute unavailable)"])
    Pip -->|Yes| Resolve["Fetch attribute from PIP"] --> Eval
    Have -->|Yes| Eval["Evaluate rule conditions<br/>subject vs resource vs env"]

    Eval --> Result{"Rule outcome?"}
    Result -->|No rule matched| DefDeny
    Result -->|Some Permit some Deny| Combine{"Combining algorithm"}
    Result -->|Only Permit| CheckEnv
    Combine -->|deny-overrides| Deny(["Deny: a Deny rule matched"])
    Combine -->|permit-overrides| CheckEnv

    CheckEnv{"Environment<br/>conditions hold?<br/>(time, IP, device)"}
    CheckEnv -->|No| DenyEnv(["Deny: context condition failed"])
    CheckEnv -->|Yes| Permit(["Permit: execute action"])
```

Notes

- **Deny by default** is the backstop: a request that matches no policy is denied, never
  implicitly permitted.
- **Indeterminate** (missing attribute, PIP error) is mapped to Deny here — fail-closed. A
  permit-biased system would need an explicit, deliberate reason to do otherwise.
- The **combining algorithm** is the tie-breaker when Permit and Deny rules both match; deny-overrides
  is the conservative default and the one most standards recommend.
- Environment conditions are drawn last only for clarity; a real PDP evaluates them as part of the
  same rule expressions.
