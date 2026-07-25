# Cross-Account Role Assumption — Swimlane Diagram

One lane per actor. The caller-side gate is in the STS lane, the resource-side gate is in the
account-B trust-policy lane.

```mermaid
flowchart TD
    subgraph Caller["Caller (account A)"]
        C1["Call AssumeRole on account-B role ARN"]
        C2["Receive temporary credentials"]
        C3["Sign account-B API request (SigV4)"]
        C4(["Use account-B resource"])
    end

    subgraph STS
        T1["Receive AssumeRole request"]
        T2{"Caller identity policy allows<br/>sts:AssumeRole on RoleArn?"}
        T3["Mint temp credentials in account B"]
        T4["Return Credentials + assumed-role ARN"]
        T5(["AccessDenied"])
    end

    subgraph TrustB["Trust policy (account B)"]
        B1{"Principal names account A<br/>or a specific A principal?"}
        B2{"ExternalId / org / MFA<br/>conditions satisfied?"}
    end

    subgraph RoleB["Role (account B)"]
        R1["Permissions policies bound the session"]
        R2["MaxSessionDuration caps duration"]
    end

    subgraph API["API (account B)"]
        P1["Authorize action vs role permissions"]
        P2["Return result, log RoleSessionName"]
    end

    C1 --> T1 --> T2
    T2 -->|No| T5
    T2 -->|Yes| B1
    B1 -->|No| T5
    B1 -->|Yes| B2
    B2 -->|No| T5
    B2 -->|Yes| R1 --> R2 --> T3 --> T4 --> C2
    C2 --> C3 --> P1 --> P2 --> C4
```

Notes

- `T2` is the account-A side, `B1`/`B2` are the account-B side — both must allow the hop.
- `B2` holds the `ExternalId` (confused-deputy) and `aws:PrincipalOrgID` conditions.
- See [flowchart.md](flowchart.md) for the full deny-terminal decision tree.
