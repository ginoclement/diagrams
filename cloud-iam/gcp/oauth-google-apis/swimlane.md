# 3-Legged OAuth to Google APIs — Swimlane Diagram

One lane per actor. Front-channel handoffs pass through the User; the code exchange and refresh
are back-channel App-to-Google calls.

```mermaid
flowchart TD
    subgraph User
        U1["Click Connect Google account"]
        U2["Authenticate + review consent screen"]
        U3{"Approve or deny?"}
        U4(["App connected"])
    end

    subgraph App["App (OAuth client)"]
        A1["Redirect to /auth<br/>(scope, access_type=offline, state)"]
        A2["Verify state"]
        A3["POST /token to exchange code"]
        A4["Store access + refresh tokens"]
        A5["Call API with Bearer token"]
        A6["Refresh when access_token expires"]
    end

    subgraph Google["Google auth server"]
        G1["Show consent for requested scopes"]
        G2["Return code (or error=access_denied)"]
        G3["Issue access_token + refresh_token"]
        G4["Issue new access_token from refresh_token"]
    end

    subgraph API["Google API"]
        P1["Validate Bearer token + scope"]
        P2["Return data"]
    end

    U1 --> A1 --> G1 --> U2 --> U3
    U3 -->|Deny| G2
    U3 -->|Approve| G2 --> A2 --> A3 --> G3 --> A4 --> A5 --> P1 --> P2 --> U4
    A5 --> A6 --> G4 --> A5
```

Notes

- The consent screen (`G1`) and its scope list live in the Google lane; the User only approves or
  denies (`U3`).
- The refresh loop (`A6 --> G4 --> A5`) stays entirely in the App/Google back channel, no user
  interaction.
- A denial routes through `G2` with `error=access_denied` and never reaches the token exchange.
