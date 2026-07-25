---
title: "Golden & Silver Ticket — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Golden & Silver Ticket — Sequence Diagram

Two forgery paths — Golden (forged TGT from the krbtgt key) and Silver (forged service
ticket from a service key) — each followed by the defense that thwarts or detects it. The
**Attacker** already holds the stolen key; no legitimate authentication precedes the forgery.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker
    participant KDC as KDC (AS + TGS)
    participant Svc as Target service
    participant Dir as Directory (DC)
    participant SIEM as Defender / SIEM

    Note over Atk,Dir: Precondition - attacker stole the krbtgt key (Golden)<br/>or a service/computer key (Silver) from a DC / Tier-0 host

    rect rgb(240,240,240)
    Note over Atk,KDC: Golden Ticket - forge a TGT
    Atk->>Atk: Forge TGT with krbtgt key<br/>(arbitrary user + elevated PAC groups)
    Atk->>KDC: TGS-REQ presenting forged TGT
    alt krbtgt rotated twice (forgery invalidated)
        KDC-->>Atk: Forged TGT fails to verify - old krbtgt key retired
    else krbtgt not rotated
        KDC->>KDC: TGT decrypts with current krbtgt key - accepted
        opt PAC validation enabled
            KDC->>KDC: Validate PAC signatures / chain
            KDC-->>Atk: Reject if PAC tampered or unsigned
        end
        KDC-->>Atk: TGS-REP - service ticket issued
        opt Detection
            KDC->>SIEM: 4769 for TGS activity with no preceding AS-REP
            SIEM->>SIEM: Anomalous TGT lifetime / RC4 / nonexistent user
            SIEM-->>Atk: Alert - golden ticket suspected
        end
    end
    end

    rect rgb(235,235,245)
    Note over Atk,Svc: Silver Ticket - forge a service ticket (KDC never contacted)
    Atk->>Atk: Forge service ticket with stolen service key<br/>(inject elevated PAC)
    Atk->>Svc: AP-REQ presenting forged service ticket
    alt Service enforces PAC validation with the KDC
        Svc->>KDC: Verify PAC signature
        KDC-->>Svc: Invalid - reject forged ticket
        Svc-->>Atk: Access denied
    else No PAC validation (legacy)
        Svc-->>Atk: Access granted - single-service compromise
        opt Detection - KDC vs host log mismatch
            Svc->>SIEM: 4624 logon on service host
            SIEM->>KDC: Was there a matching 4769 (TGS-REQ)?
            KDC-->>SIEM: None - service ticket never issued by KDC
            SIEM->>SIEM: Logon with no KDC ticket = silver ticket
            SIEM-->>Atk: Alert - forged service ticket
        end
    end
    end

    opt Containment
        SIEM->>Dir: Rotate krbtgt twice + affected service keys,<br/>enforce PAC validation, protect Tier-0
    end
```

Notes

- **Golden** forges a TGT (krbtgt key) and is redeemed at the TGS — see
  [as-exchange](../../authentication/kerberos/as-exchange/README.md) and
  [tgs-exchange](../../authentication/kerberos/tgs-exchange/README.md).
- **Silver** forges a service ticket (service key) and is presented straight to the service —
  see [ap-exchange](../../authentication/kerberos/ap-exchange/README.md). The KDC never sees it, so its logs
  won't show a 4769; that absence is the detection.
- Rotating krbtgt **twice** is what actually invalidates existing golden tickets; PAC
  validation defeats forged privilege claims in both variants.
