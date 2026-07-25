---
title: "Risk-Based Adaptive Authentication — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Risk-Based Adaptive Authentication — Decision Flowchart

How signals become a risk level and how the level maps to allow / step-up / deny. Hard
signals are evaluated before soft ones so a known-bad context cannot be scored down to allow.

```mermaid
flowchart TD
    S(["User submits primary factor"]) --> P{"Primary factor valid?"}
    P -->|No| D1(["Deny: bad credentials"])
    P -->|Yes| COL["Collect signals:<br/>device, geo, velocity,<br/>reputation, threat intel"]

    COL --> AVAIL{"Signals + engine available?"}
    AVAIL -->|No| STEP["Step-up required<br/>(fail closed)"]
    AVAIL -->|Yes| HARD{"Hard signal fired?<br/>leaked credential /<br/>impossible travel /<br/>known-bad IP"}

    HARD -->|Yes| D2(["Deny: high risk, alert raised"])
    HARD -->|No| SCORE{"Composite risk level?"}

    SCORE -->|Low| ALLOW(["Allow: issue tokens<br/>with achieved acr / amr"])
    SCORE -->|Medium| STEP
    SCORE -->|High| D2

    STEP --> CH{"Step-up satisfied?<br/>(prefer FIDO2 / passkey)"}
    CH -->|No| D3(["Deny: assurance not met"])
    CH -->|Yes| RE{"Residual risk after<br/>step-up acceptable?"}
    RE -->|Yes| ALLOWU(["Allow: issue tokens<br/>with elevated acr"])
    RE -->|No| D2
```

Notes

- The `AVAIL` gate encodes fail-closed behaviour: a missing engine or feed forces step-up,
  never a silent allow.
- Hard signals short-circuit to deny before the composite score is even consulted, because
  they represent confirmed-bad context rather than mere unfamiliarity.
- A satisfied step-up feeds back into a residual-risk check (`RE`); a high enough base risk
  can still deny even after a correct challenge.
