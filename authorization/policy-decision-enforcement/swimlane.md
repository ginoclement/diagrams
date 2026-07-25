---
title: "Policy Decision and Enforcement — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Policy Decision and Enforcement — Swimlane Diagram

One lane per component. The PEP enforces; the PDP decides; the PIP supplies missing attributes; the
PAP distributes policy out of band. Obligations are applied back in the PEP lane.

```mermaid
flowchart TD
    subgraph Client
        C1["Send request<br/>(action on resource)"]
        C2(["Receive allow / deny /<br/>transformed response"])
    end

    subgraph PEP["PEP (Gateway / Sidecar)"]
        P1["Intercept request"]
        P2["Build decision request:<br/>subject, action, resource, context"]
        P3{"PDP reachable?"}
        P4["Fail closed: 403"]
        P5{"Decision?"}
        P6["Apply obligations<br/>(redact, log, headers)"]
        P7{"Obligations satisfied?"}
        P8["Forward to resource"]
        P9["Deny: 403"]
    end

    subgraph PDP["PDP (Policy Engine)"]
        D1["Load active policy"]
        D2{"Attributes<br/>sufficient?"}
        D3["Evaluate policy"]
        D4["Return decision + obligations"]
    end

    subgraph PIP["PIP (Attributes)"]
        N1["Resolve subject / resource /<br/>context attributes"]
    end

    subgraph PAP["PAP (Control Plane)"]
        A1["Author + version policy"]
        A2["Distribute signed policy"]
    end

    subgraph API["Resource"]
        R1["Execute action, return data"]
    end

    A1 --> A2 -.->|"verify + activate"| D1
    C1 --> P1 --> P2 --> P3
    P3 -->|No| P4 --> C2
    P3 -->|Yes| D1
    D1 --> D2
    D2 -->|No| N1 --> D3
    D2 -->|Yes| D3
    D3 --> D4 --> P5
    P5 -->|Deny / Indeterminate| P9 --> C2
    P5 -->|Permit| P6 --> P7
    P7 -->|No| P9
    P7 -->|Yes| P8 --> R1 --> C2
```

Notes

- The **PAP lane feeds the PDP out of band** (dashed): policy propagates by distribution, decoupled
  from the request path and from PEP/service deploys.
- `P3` and `P5`'s `Indeterminate` branch are the **fail-closed** gates — an unreachable PDP or an
  undecidable request both deny.
- **Obligations round-trip through the PEP** (`P6 → P7`): a permit is only honored if its obligations
  are fully applied; otherwise it falls through to deny (`P9`).
- The PIP is consulted **only when the decision request lacks an attribute** the policy needs
  (`D2 → N1`), keeping the common path a single decision call.
