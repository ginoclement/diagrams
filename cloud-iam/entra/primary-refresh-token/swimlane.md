# Primary Refresh Token — Swimlane

One lane per component. The TPM lane holds device and session keys; token requests are
always signed there before reaching Entra.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in to device"]
        U2["Launch app"]
        U3(["SSO everywhere"])
        U4(["Re-auth prompt"])
    end

    subgraph CloudAP
        C1["Drive logon,<br/>request PRT"]
        C2["Import session key<br/>into TPM"]
        C3["Renew PRT in background"]
    end

    subgraph TPM
        T1["Hold device key<br/>(attested at join)"]
        T2["Store PRT session key"]
        T3["Sign token requests"]
    end

    subgraph WAM
        W1["Request app token<br/>with PRT"]
        W2["Deliver token to app"]
    end

    subgraph Entra
        E1["Validate device + user,<br/>issue PRT + session key"]
        E2{"PRT valid<br/>and bound?"}
        E3["Issue app access_token"]
        E4["invalid_grant"]
    end

    subgraph App
        P1["Consume access_token"]
    end

    U1 --> C1 --> T1
    C1 --> E1 --> C2 --> T2 --> U3
    U2 --> W1 --> T3 --> E2
    E2 -->|Yes| E3 --> W2 --> P1
    E2 -->|No| E4 --> C1
    C3 --> E1
    E4 --> U4
```

Notes

- The `T3 --> E2` edge is the proof-of-possession: every app-token request is signed with
  the TPM-held session key, so a copied PRT is useless off the device.
- Background renewal (`C3 --> E1`) keeps SSO alive without user interaction until the PRT
  is invalidated by password change, device disable, or a CA revoke.
