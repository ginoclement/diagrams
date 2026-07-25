# Hybrid Identity Sync — Swimlane Diagram

One lane per actor. The three sign-in methods diverge at Entra: PHS validates in the Entra lane,
PTA and Federation cross into the Agent and AD lanes.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in with corporate account"]
        U2(["Signed in to cloud app"])
    end

    subgraph Entra["Microsoft Entra ID"]
        E1{"Sign-in method<br/>for this domain?"}
        E2["PHS: validate against synced hash"]
        E3["PTA: queue encrypted credential"]
        E4["Federation: redirect to AD FS"]
        E5["Issue tokens"]
    end

    subgraph Connect["Entra Connect"]
        C1["Sync users<br/>(and hash-of-hash for PHS)"]
    end

    subgraph Agent["PTA agent / AD FS"]
        G1["PTA agent picks up credential"]
        G2["AD FS authenticates, issues token"]
    end

    subgraph AD["On-prem AD"]
        D1["Source of user objects + passwords"]
        D2["Validate password (PTA / AD FS)"]
    end

    D1 --> C1 --> E1
    U1 --> E1
    E1 -->|PHS| E2 --> E5
    E1 -->|PTA| E3 --> G1 --> D2 --> E5
    E1 -->|"Federation (legacy)"| E4 --> G2 --> D2 --> E5
    E5 --> U2
```

Notes

- PHS (`E2`) never leaves the Entra lane at sign-in, so an AD outage does not block it.
- PTA and Federation both funnel through `D2` in the AD lane and fail if AD is unreachable.
- Connect (`C1`) runs continuously and is independent of the interactive sign-in path.
