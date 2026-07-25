---
title: "IAM Allow-Policy Evaluation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IAM Allow-Policy Evaluation — Decision Flowchart

Deny-then-allow logic with inheritance and conditions. Every deny path terminates explicitly.

```mermaid
flowchart TD
    Start(["API call: principal + permission + resource"]) --> Deny{"Deny policy rule<br/>matches principal,<br/>permission, condition?"}
    Deny -->|"Yes"| Exc{"Principal in<br/>exceptionPrincipals?"}
    Exc -->|No| DDeny(["DENY: explicit deny policy"])
    Exc -->|Yes| Gather
    Deny -->|No| Gather["Gather allow bindings from resource,<br/>project, folder(s), organization"]

    Gather --> Union["Union all bindings<br/>(inheritance is additive)"]
    Union --> Match{"A binding grants a role<br/>containing the permission<br/>to this principal?"}
    Match -->|"No direct member"| Grp{"Principal is member<br/>via a Google group?"}
    Grp -->|No| ADeny(["DENY: no matching binding"])
    Grp -->|Yes| Cond
    Match -->|Yes| Cond{"Binding has an<br/>IAM Condition?"}

    Cond -->|No condition| Allow(["ALLOW"])
    Cond -->|"Condition true"| Allow
    Cond -->|"Condition false"| CDeny(["DENY: condition not satisfied"])
```

Notes

- The deny gate runs before any allow logic; only an `exceptionPrincipals` entry lets a matched
  principal continue to allow evaluation.
- There is no precedence between hierarchy levels for allows — a single matching binding at org,
  folder, project, or resource is sufficient, which is why `Union` precedes `Match`.
- A binding whose CEL condition is false is treated as absent; if it was the only match, the
  result is DENY.
