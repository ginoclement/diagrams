# ABAC — Swimlane Diagram

One lane per component. The PDP evaluates policy against attributes gathered from the request, the
PIPs, and the policies published by the PAP.

```mermaid
flowchart TD
    subgraph Subject
        U1["Request action on resource"]
        U2(["Receive Permit or Deny"])
    end

    subgraph PEP
        P1["Build decision request:<br/>subject, action, resource, env"]
        P2["Send to PDP"]
        P3{"PDP decision?"}
        P4["Forward to resource"]
        P5["Return 403 Forbidden"]
    end

    subgraph PDP
        D1["Select applicable policies"]
        D2{"All needed<br/>attributes present?"}
        D3["Evaluate conditions:<br/>subject vs resource vs env"]
        D4["Apply combining algorithm<br/>(deny-overrides)"]
    end

    subgraph PIP
        I1["Resolve missing attributes<br/>(HR, device, risk, resource meta)"]
    end

    subgraph PAP
        A1["Author + publish policies"]
    end

    subgraph API["Resource"]
        R1["Execute action, return data"]
    end

    A1 -.->|"policies"| D1
    U1 --> P1 --> P2 --> D1 --> D2
    D2 -->|No| I1 --> D3
    D2 -->|Yes| D3
    D3 --> D4 --> P3
    P3 -->|Permit| P4 --> R1 --> U2
    P3 -->|Deny or Indeterminate| P5 --> U2
```

Notes

- The PAP lane feeds policies into the PDP out of band (dashed) — policy authoring is not on the
  request path.
- `D2 --> I1` is the PIP round trip; if the PIP errors, `D4` yields **Indeterminate**, which the
  combining algorithm maps to Deny for fail-closed resources.
- Compare with the [XACML swimlane](../xacml-pdp-pep/swimlane.md): same PEP/PDP/PIP/PAP roles,
  formalized as a standard.
