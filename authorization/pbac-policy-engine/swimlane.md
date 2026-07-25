# PBAC Policy Engine (OPA / Cedar) — Swimlane Diagram

One lane per component. The app is the enforcement point; the engine evaluates policy pulled from
the bundle server and emits decision logs.

```mermaid
flowchart TD
    subgraph App["App / Gateway (PEP)"]
        A1["Intercept request"]
        A2["Build input:<br/>principal, action, resource, context"]
        A3["Call policy engine"]
        A4{"decision?"}
        A5["Allow: execute"]
        A6["Deny: 403"]
        A7{"Engine reachable?"}
        A8["Fail closed: 403"]
    end

    subgraph PE["Policy Engine (PDP)"]
        E1["Load active bundle<br/>(policies + entity data)"]
        E2["Evaluate rules against input"]
        E3["Apply forbid/deny-overrides"]
        E4["Return allow or deny"]
        E5["Emit decision record"]
    end

    subgraph Bundle["Bundle Server (PAP)"]
        B1["Author + version policy<br/>(Rego / Cedar)"]
        B2["Publish signed bundle"]
    end

    subgraph Log["Decision Log Sink"]
        L1["Store input + decision<br/>+ policy version"]
    end

    B1 --> B2 -.->|"pull + verify signature"| E1
    A1 --> A2 --> A3 --> A7
    A7 -->|No| A8
    A7 -->|Yes| E2
    E1 -.-> E2
    E2 --> E3 --> E4 --> A4
    E4 --> E5 --> L1
    A4 -->|allow| A5
    A4 -->|deny| A6
```

Notes

- The bundle server lane feeds policy to the engine out of band (dashed): policy changes propagate
  by **bundle pull**, decoupled from the request path and from app deploys.
- `A7` is the fail-closed gate: if the PDP is unreachable, the PEP denies rather than allowing.
- Every decision forks to the **decision log** (`E5 → L1`) for audit and debugging, in parallel with
  returning the result to the PEP.
