# Just-In-Time Privilege Elevation — Swimlane Diagram

One lane per actor. The eligible-only resting state and the auto-revoke return to it
bookend the flow.

```mermaid
flowchart TD
    subgraph User
        U0["Eligible for role<br/>(no standing access)"]
        U1["Request activation<br/>(role, scope, reason)"]
        U2["Complete fresh MFA"]
        U3["Perform privileged work"]
        U4["Deactivate early<br/>(optional)"]
    end

    subgraph PIM["PIM service"]
        M1["Evaluate activation policy<br/>(risk, location, ticket)"]
        M2{"Approval<br/>required?"}
        M3["Schedule expiry (TTL)"]
        M4["Revoke at expiry<br/>or on early deactivation"]
    end

    subgraph Approver
        A1["Review request"]
        A2{"Approve?"}
    end

    subgraph Directory
        D1["Write time-bound<br/>active assignment"]
        D2["Remove active assignment"]
    end

    subgraph Target
        T1["Authorize actions<br/>while assignment active"]
    end

    U0 --> U1 --> M1 --> U2 --> M2
    M2 -->|"Yes"| A1 --> A2
    A2 -->|"No"| U1
    A2 -->|"Yes"| D1
    M2 -->|"No - auto"| D1
    D1 --> M3 --> U3 --> T1
    U4 --> M4
    M3 --> M4 --> D2 --> U0
```

Notes

- `A2 -->|No| U1` and a policy fail inside `M1` are the deny paths; neither writes an
  assignment, so the User stays in the eligible-only state `U0`.
- Both the timed expiry from `M3` and the optional early deactivation `U4` route through
  the same revoke step `M4`, returning the User to `U0`.
- `D1`/`D2` are the only writes to standing state — everything the User does in `U3`/`T1`
  is scoped to the lifetime of that single assignment.
