# Credential Vault Check-Out / Check-In — Swimlane Diagram

One lane per actor. The brokered path keeps the secret on the PAM-to-Target hop only.

```mermaid
flowchart TD
    subgraph User
        U1["Authenticate to PAM<br/>(SSO + MFA)"]
        U2["Request check-out<br/>(target, reason, window)"]
        U3["Work in proxied session"]
        U4["Check in / end session"]
    end

    subgraph PAM["PAM (vault + broker)"]
        P1["Verify identity<br/>and entitlement"]
        P2{"Approval<br/>required?"}
        P3{"Account<br/>available?"}
        P4["Acquire lock,<br/>open lease with TTL"]
        P5["Inject credential,<br/>open recorded session"]
        P6["Close session on check-in<br/>or TTL expiry"]
        P7["Rotate credential,<br/>release lock, write audit"]
    end

    subgraph Approver
        A1["Review request"]
        A2["Approve or deny<br/>(time-boxed)"]
    end

    subgraph Target
        T1["Accept brokered<br/>privileged login"]
        T2["Session closed"]
    end

    subgraph Directory
        D1["Confirm group membership"]
        D2["Apply new random password"]
    end

    U1 --> P1 --> D1 --> P2
    U2 --> P2
    P2 -->|"Yes"| A1 --> A2 --> P3
    P2 -->|"No"| P3
    P3 -->|"Yes"| P4 --> P5 --> T1 --> U3
    P3 -->|"No - locked"| U2
    U4 --> P6 --> T2
    P6 --> P7 --> D2
```

Notes

- The `P3 -->|No - locked| U2` edge is the exclusive-lock contention path: the admin is
  bounced back to request again later (or queue).
- Auto check-in on TTL expiry enters `P6` without a `U4` check-in, so rotation still runs
  even when the human walks away.
- Directory here doubles as the account store being rotated (`D2`); for local accounts
  the Target itself would host that step.
