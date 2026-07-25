---
title: "Kerberoasting — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Kerberoasting — Swimlane Diagram

Lanes for Attacker, Victim (service account), KDC, and Defender controls. Dashed arrows are
detection signals; the offline crack happens entirely inside the Attacker lane.

```mermaid
flowchart TD
    subgraph Attacker
        A1["Hold a valid TGT<br/>(any domain account)"]
        A2["Enumerate SPNs via LDAP"]
        A3["TGS-REQ for target SPN<br/>(prefer RC4 if allowed)"]
        A4["Extract encrypted blob,<br/>crack password OFFLINE"]
        A5(["Password recovered<br/>- authenticate as service"])
        A6(["Crack infeasible<br/>- attack neutralized"])
    end

    subgraph Victim["Victim (service account)"]
        V1{"gMSA or 25+ char<br/>random password?"}
        V2{"AES enforced,<br/>RC4 removed?"}
    end

    subgraph KDC["KDC / TGS"]
        K1["Issue TGS-REP<br/>(behaves as designed)"]
    end

    subgraph Defender["Defender controls"]
        D1["Ingest event 4769"]
        D2{"Anomaly? many SPNs,<br/>RC4 in AES env,<br/>honeypot SPN"}
        D3(["Alert - disable account,<br/>migrate to gMSA, strip privileges"])
    end

    A1 --> A2 --> A3 --> K1
    K1 --> A4
    K1 -.->|4769 logged| D1 --> D2
    D2 -->|Yes| D3
    D2 -->|No| A4
    A4 --> V1
    V1 -->|Yes| A6
    V1 -->|No| V2
    V2 -->|Yes - slowed| A6
    V2 -->|No - weak + RC4| A5
```

Notes

- The Victim lane is a pair of **posture gates**: strong/managed password and AES-only. Pass
  both and the crack fails even though the ticket was issued normally.
- The KDC lane does exactly one thing — issue the ticket — underscoring that the protocol
  itself is not the vulnerability.
- `D2` (event-4769 anomaly, especially a honeypot-SPN hit) is the detection path that runs in
  parallel with the offline crack.
