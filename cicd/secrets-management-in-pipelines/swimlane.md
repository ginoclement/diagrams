---
title: "Secrets Management in Pipelines — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Management in Pipelines — Swimlane Diagram

One lane per actor/component. Arrows crossing lanes show the secret's journey: request from
the job, policy check at the store, injection through the CI system onto the runner, and the
masked (but public-treated) log output.

```mermaid
flowchart TD
    subgraph Job
        J1["Step needs a credential"]
        J2["Use secret<br/>(registry / cloud / API)"]
        J3(["Job completes"])
    end

    subgraph CI["CI/CD system"]
        C1["Forward request with context<br/>(identity, environment, ref)"]
        C2{"Trusted context?<br/>(protected branch/env,<br/>not a fork)"}
        C3["Register value for masking"]
        C4["Inject into runner<br/>(env var / file)"]
        C5(["No secret injected<br/>build/test only"])
    end

    subgraph Store["Secret store"]
        S1{"Which source?"}
        S2["Native store value<br/>(scoped to env/branch)"]
        S3["Vault dynamic secret<br/>(short TTL, auto-revoke)"]
        S4["OIDC exchange<br/>(short-lived, none at rest)"]
        S5["Revoke + rotate<br/>on leak"]
    end

    subgraph Runner
        R1["Hold secret in memory<br/>for the step only"]
    end

    subgraph Log["Log sink"]
        L1["Masked output<br/>(treat as public)"]
    end

    J1 --> C1 --> C2
    C2 -->|"No - fork/untrusted"| C5 --> J3
    C2 -->|"Yes - trusted"| S1
    S1 -->|"Native"| S2 --> C3
    S1 -->|"Dynamic"| S3 --> C3
    S1 -->|"OIDC"| S4 --> C3
    C3 --> C4 --> R1 --> J2 --> L1
    L1 -->|"scanner flags a value"| S5
    J2 --> J3
```

Notes

- The trust gate (`C2`) is the exfiltration boundary: fork/untrusted runs never reach the
  store and get no secret (`C5`).
- The store lane shows the three sources ranked by safety — native stored value, dynamic
  short-TTL secret, and OIDC with nothing at rest (preferred).
- The runner holds the value in memory for the step only; ephemeral runners then discard it
  (see [Ephemeral runner isolation](../ephemeral-runner-isolation/README.md)).
- Masking happens before the log sink, but the log is still treated as public; a flagged value
  triggers revoke-and-rotate (`S5`).
