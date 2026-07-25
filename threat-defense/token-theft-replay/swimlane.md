# Token Theft & Replay — Swimlane Diagram

Lanes for Attacker, Victim, IdP, and Defender controls. Solid arrows are the replay path; dashed
arrows into the Defender lane are proof checks, reuse detection, and revocation.

```mermaid
flowchart TD
    subgraph Attacker
        A1["Obtain victim tokens<br/>(stealer, log, AiTM)"]
        A2["Replay access_token<br/>from attacker host"]
        A3["Redeem stolen<br/>refresh_token"]
        A4(["Persistent access<br/>as victim"])
    end

    subgraph Victim
        V1["Legitimate token holder<br/>- passive during replay"]
    end

    subgraph IdP["IdP / authorization server"]
        I1{"Refresh token<br/>already rotated / used?"}
        I2["Issue new access_token"]
        I3["Revoke entire<br/>token family"]
    end

    subgraph API
        P1{"Token sender-constrained?<br/>DPoP / mTLS"}
        P2{"Proof-of-possession<br/>valid?"}
        P3["Return data<br/>(bearer)"]
    end

    subgraph Defender["Defender controls"]
        D1(["DENY: PoP mismatch,<br/>replay rejected"])
        D2{"CAE / risk:<br/>new ASN, impossible travel?"}
        D3(["DETECT: revoke session<br/>mid-lifetime"])
        D4(["DETECT: reuse = theft,<br/>revoke family, notify"])
    end

    A1 --> A2 --> P1
    V1 -.->|tokens stolen, no action| A1
    P1 -->|Yes| P2
    P2 -->|No| D1
    P2 -->|Yes| P3 --> A4
    P1 -->|No - bearer| P3
    P3 -.->|API telemetry| D2
    D2 -->|Yes| D3 -.->|revoked| A4
    D2 -->|No| A4
    A4 --> A3 --> I1
    I1 -->|Yes| D4 --> I3
    I1 -->|No| I2 --> A4
```

Notes

- The Victim lane is passive — a hallmark of replay — so controls must live at the **API**
  (proof-of-possession) and **IdP** (reuse detection), not at a login step.
- Outright prevention is `P2 --> No` (sender-constrained token); refresh-token **reuse detection**
  (`I1 --> Yes`) contains a stolen refresh token by revoking the family.
- The weak path is `P1 --> bearer` plus `I1 --> No` (no rotation): without binding or rotation,
  replay is hard to catch — hence DPoP/mTLS and rotation are the durable fixes.
