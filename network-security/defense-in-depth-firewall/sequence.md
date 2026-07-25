---
title: "Defense in Depth — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Defense in Depth — Sequence Diagram

Happy path: an inbound connection is evaluated and logged at each layer, then reaches the
app. Alternates: IPS drops/resets a malicious flow, and egress filtering blocks outbound
C2.

```mermaid
sequenceDiagram
    autonumber
    participant Net as Internet
    participant FW as Stateful firewall
    participant IPS as IDS/IPS
    participant PX as Proxy
    participant HF as Host firewall
    participant EDR as EDR (host)
    participant App as Application
    participant SIEM as SIEM

    %% ----- happy path: clean connection -----
    Net->>FW: New connection (SYN)
    FW->>FW: Match 5-tuple + state - permitted
    FW->>SIEM: Log allow
    FW->>IPS: Pass packets for inspection
    IPS->>IPS: Signature + anomaly check - clean
    IPS->>SIEM: Log inspected/clean
    IPS->>PX: Forward
    PX->>PX: App-layer policy, URL/category, TLS inspection
    PX->>HF: Forward to host
    HF->>HF: Local port/process rule - permitted
    HF->>EDR: Deliver to process (EDR observing)
    EDR->>App: Allow process to handle request
    App-->>Net: Response
    Note over FW,EDR: Independent layers - a bypass at one is caught at the next

    %% ----- IPS drops/resets a malicious flow -----
    alt Malicious payload detected inline
        Net->>FW: Connection permitted by 5-tuple
        FW->>IPS: Pass packets
        IPS->>IPS: Payload matches exploit signature
        IPS->>SIEM: Alert - high confidence
        IPS-->>Net: TCP RST / drop packets (flow torn down)
        Note over IPS,App: Connection never reaches the host -<br/>IPS is inline, unlike a detect-only IDS
    end

    %% ----- egress filtering blocks C2 -----
    alt Compromised host beacons outbound
        EDR->>App: Suspicious process spawns outbound connection
        App->>HF: Outbound to attacker C2 domain
        HF->>PX: Egress via proxy
        PX->>PX: Destination category = malware/C2 - deny
        PX->>FW: (or) egress firewall rule blocks unknown destination
        FW-->>App: Outbound DROP
        PX->>SIEM: Alert - blocked C2 beacon
        EDR->>EDR: Quarantine process / isolate host
        Note over HF,SIEM: Default-deny egress + EDR contains a live intrusion
    end
```
