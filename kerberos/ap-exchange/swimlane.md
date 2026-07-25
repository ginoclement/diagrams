---
title: "AP Exchange — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AP Exchange — Swimlane Diagram

One lane per actor; arrows crossing lanes are protocol handoffs.

```mermaid
flowchart TD
    subgraph Client["Client (has service ticket)"]
        C1["Build authenticator { cname, timestamp,<br/>seq-number } encrypted with SK-svc"]
        C2["Send AP-REQ:<br/>ap-options=MUTUAL-REQUIRED,<br/>service ticket + authenticator"]
        C3["Receive AP-REP"]
        C4["Decrypt AP-REP with SK-svc,<br/>verify echoed timestamp"]
        C5["Session authenticated<br/>(SK-svc protects traffic)"]
        C6["Handle KRB-ERROR"]
    end

    subgraph Service
        S1["Decrypt service ticket with K-svc,<br/>recover SK-svc + PAC"]
        S2["Decrypt authenticator with SK-svc,<br/>check timestamp + skew"]
        S3["Check replay cache"]
        S4["Add authenticator to replay cache"]
        S5["Send AP-REP encrypted with SK-svc"]
        S6["Send KRB-ERROR<br/>(REPEAT / SKEW / MODIFIED)"]
    end

    subgraph DC["DC (KDC)"]
        DC1["Verify PAC signature (optional)"]
    end

    C1 --> C2
    C2 --> S1
    S1 -->|"decrypts"| S2
    S1 -->|"key mismatch"| S6
    S2 -->|"fresh + in skew"| S3
    S2 -->|"skew"| S6
    S3 -->|"not seen"| S4
    S3 -->|"already seen"| S6
    S4 --> DC1
    DC1 --> S5
    S5 --> C3
    C3 --> C4
    C4 --> C5
    S6 --> C6
```
