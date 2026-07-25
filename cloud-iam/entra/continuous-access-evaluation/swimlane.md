# Continuous Access Evaluation — Swimlane

One lane per actor. The Admin lane triggers the critical events that drive re-evaluation.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in"]
        U2(["Access continues"])
        U3(["Access revoked"])
    end

    subgraph Client
        C1["Request CAE token"]
        C2["Call resource with token"]
        C3["Handle claims challenge,<br/>re-request token"]
    end

    subgraph Entra
        E1["Issue long-lived CAE token"]
        E2["Publish critical events"]
        E3{"Re-evaluate: account,<br/>risk, CA, location"}
        E4["Issue new token"]
        E5["Deny token"]
    end

    subgraph Resource
        R1["Validate token + CAE claims"]
        R2{"Token still<br/>acceptable?"}
        R3["401 claims challenge"]
    end

    subgraph Admin
        A1["Disable user / revoke /<br/>change policy"]
    end

    U1 --> C1 --> E1 --> C2 --> R1 --> R2
    R2 -->|Yes| U2
    A1 --> E2 --> R2
    R2 -->|No| R3 --> C3 --> E3
    E3 -->|"Now compliant"| E4 --> C2
    E3 -->|"Disabled / blocked"| E5 --> U3
```

Notes

- The `A1 --> E2 --> R2` path is what makes revocation near-real-time: the resource learns
  of the critical event and starts challenging the existing token.
- The claims-challenge loop (`R3 --> C3 --> E3`) forces the client back through Entra so the
  current state is re-evaluated before any new token is issued.
