---
title: "Pass-the-Hash / Pass-the-Ticket — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pass-the-Hash / Pass-the-Ticket — Swimlane Diagram

Lanes for Attacker, Victim, IdP/servers (KDC and target systems), and Defender controls.
Dashed arrows are detection signals.

```mermaid
flowchart TD
    subgraph Attacker
        A1["Admin on beachhead host"]
        A2["Read LSASS / cached secrets"]
        A3["Reuse NT hash via NTLM (PtH)"]
        A4["Inject stolen ticket,<br/>replay via Kerberos (PtT)"]
        A5(["Lateral movement as victim"])
        A6(["No reusable material"])
        A7(["Reuse blocked - low tier only"])
    end

    subgraph Victim
        V1["Privileged session /<br/>credentials on the host"]
    end

    subgraph Servers["KDC + target servers"]
        K1["NTLM challenge/response<br/>verifies the hash"]
        K2["KDC redeems TGT,<br/>service accepts ticket"]
        T1{"Stolen creds reach<br/>Tier-0 assets?"}
    end

    subgraph Defender["Defender controls"]
        D1{"Credential Guard +<br/>LSASS PPL?"}
        D2(["Theft prevented"])
        D3["Correlate 4776 / 4624 type 3<br/>and ticket use"]
        D4{"NTLM from odd host /<br/>ticket without prior AS-TGS?"}
        D5(["Alert - isolate, reset creds,<br/>rotate LAPS / krbtgt"])
    end

    A1 --> A2 --> D1
    D1 -->|Yes| D2
    D1 -->|No| V1
    V1 --> A3 --> K1
    V1 --> A4 --> K2
    K1 --> T1
    K2 --> T1
    K1 -.->|logon logged| D3
    K2 -.->|ticket use logged| D3
    D3 --> D4
    D4 -->|Yes| D5
    D4 -->|No| T1
    T1 -->|"No - tiering"| A7
    T1 -->|Yes| A5
```

Notes

- `D1` (Credential Guard + LSASS PPL) is the single control that stops the attack at the
  source by denying the theft primitive.
- `T1` is the **tiering** gate: even valid reused credentials are contained if privileged
  accounts never touched the beachhead.
- `D4` is behavioral detection — NTLM from an unexpected host, or a ticket used on a system
  that never performed the AS/TGS exchange to obtain it.
