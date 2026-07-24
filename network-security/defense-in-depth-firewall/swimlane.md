# Defense in Depth — Swimlane

Zones are the successive defensive layers from the Internet down to the host process.
Solid arrows are the allowed inbound path; dashed arrows show the IPS reset and the
blocked outbound C2. Every layer feeds the SIEM.

```mermaid
flowchart TD
    subgraph Internet["Internet (untrusted)"]
        NET["Inbound connection"]
        C2["Attacker C2 endpoint"]
    end

    subgraph Perimeter["Network perimeter"]
        FW{"Stateful firewall<br/>5-tuple + state?"}
        IPS{"IDS/IPS<br/>signature + anomaly?"}
    end

    subgraph AppLayer["Application inspection"]
        PX{"Proxy: app-layer<br/>+ egress category?"}
    end

    subgraph Host["Endpoint / host"]
        HF{"Host firewall<br/>port/process rule?"}
        EDR["EDR behavioural<br/>monitoring"]
        APP["Application process"]
    end

    subgraph Logging["Cross-cutting"]
        SIEM["SIEM / log store"]
    end

    %% inbound allowed path
    NET --> FW
    FW -->|allow| IPS
    FW -->|deny| DFW(["Drop at firewall"])
    IPS -->|clean| PX
    IPS -.->|"malicious: RST/drop"| DIPS(["Flow reset -<br/>never reaches host"])
    PX -->|allow| HF
    HF -->|allow| EDR --> APP

    %% outbound C2 blocked
    APP -.->|"beacon out"| HF
    HF -.-> PX
    PX -.->|"deny C2 / egress"| DEG(["Egress blocked -<br/>C2 contained"])

    %% logging
    FW --> SIEM
    IPS --> SIEM
    PX --> SIEM
    EDR --> SIEM
```
