# Golden & Silver Ticket — Swimlane Diagram

Lanes for Attacker, Victim, KDC, and Defender controls. The Golden path traverses the KDC;
the Silver path bypasses it (dashed to the KDC only for PAC validation / log correlation).

```mermaid
flowchart TD
    subgraph Attacker
        A1["Steal krbtgt key<br/>or service key (Tier-0)"]
        A2["Forge TGT with krbtgt key<br/>(Golden)"]
        A3["Present forged TGT to TGS"]
        A4["Forge service ticket with<br/>service key (Silver)"]
        A5["Present forged ticket<br/>straight to service"]
        A6(["Domain-wide access"])
        A7(["Single-service access"])
        A8(["Forgery rejected"])
    end

    subgraph Victim
        V1["Impersonated identity<br/>+ target service"]
    end

    subgraph KDC["KDC (AS + TGS)"]
        K1{"krbtgt rotated twice?"}
        K2{"PAC validation<br/>enabled?"}
        K3["Issue service ticket"]
    end

    subgraph Defender["Defender controls"]
        D1(["Old krbtgt retired<br/>- golden ticket dead"])
        D2["Correlate 4769 vs AS-REP<br/>and vs host 4624"]
        D3{"KDC ticket present<br/>for this logon?"}
        D4(["Alert - forged ticket,<br/>rotate keys, protect Tier-0"])
    end

    A1 --> A2 --> A3 --> K1
    K1 -->|Yes| D1
    K1 -->|No| K2
    K2 -->|Yes - tampered PAC| A8
    K2 -->|No| K3 --> A6
    K3 -.->|4769 logged| D2

    A1 --> A4 --> A5 --> V1
    A5 -.->|host 4624 logged| D2 --> D3
    D3 -->|No matching 4769| D4
    D3 -->|Yes| A7
    V1 --> A7
```

Notes

- **Golden** flows through `K1`/`K2` at the KDC; a double krbtgt rotation (`K1 --> Yes`) is the
  clean kill, and PAC validation (`K2`) rejects tampered privilege claims.
- **Silver** reaches the service without touching the KDC, so `D3` — "host logon with no
  matching KDC 4769" — is the defining detection.
- Both variants end in containment: rotate the compromised keys and protect Tier-0 so the
  keys can't be re-stolen.
