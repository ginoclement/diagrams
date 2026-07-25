# Step-Up Authentication — Swimlane Diagram

One lane per actor. The API lane issues the challenge; the IdP lane raises assurance.

```mermaid
flowchart TD
    subgraph User
        U1["Request sensitive action"]
        U2["Complete stronger factor<br/>(only if challenged)"]
        U3(["Action confirmed"])
        U4(["Action refused"])
    end

    subgraph Client
        C1["Call API with current token"]
        C2["Re-authorize with acr_values + max_age"]
        C3["Retry action with new token"]
    end

    subgraph API
        A1{"Token acr / auth_time<br/>meet action policy?"}
        A2["401 insufficient_user_authentication<br/>(acr_values, max_age)"]
        A3["Perform action"]
    end

    subgraph IdP
        I1{"Session already<br/>satisfies request?"}
        I2["Challenge stronger / fresher factor"]
        I3["Issue token: elevated acr,<br/>fresh auth_time"]
        I4["No elevated token"]
    end

    U1 --> C1 --> A1
    A1 -->|Yes| A3 --> U3
    A1 -->|No| A2 --> C2 --> I1
    I1 -->|Yes| I3
    I1 -->|No| I2 --> U2
    U2 -->|Success| I3
    U2 -->|Fail / cancel| I4 --> U4
    I3 --> C3 --> A3 --> U3
```

Notes

- The first pass through `A1` is the fast path: a token that already meets policy skips the
  IdP entirely.
- The challenge lives in the IdP lane (`I2`); the API only *demands* an assurance and
  *verifies* it on retry — it never runs the factor itself.
- See [flowchart.md](flowchart.md) for the exact `acr` / `max_age` comparison logic.
