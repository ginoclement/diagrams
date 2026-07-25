---
title: "Defense in Depth — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Defense in Depth — Decision Flowchart

A connection is evaluated layer by layer. Each layer can allow-and-log or deny; the last
gates are on the host itself, and outbound traffic is checked by egress filtering.

```mermaid
flowchart TD
    Start(["Connection / packet<br/>arrives"]) --> Dir{"Inbound or<br/>outbound?"}

    %% inbound chain
    Dir -->|inbound| FW{"Firewall: 5-tuple +<br/>state permitted?"}
    FW -->|no| DFW(["DROP at firewall (log)"])
    FW -->|yes| IPS{"IPS: signature /<br/>anomaly clean?"}
    IPS -->|"no (block mode)"| DIPS(["Drop + TCP RST,<br/>alert SIEM"])
    IPS -->|"no (detect-only IDS)"| Alert["Alert only -<br/>flow continues"]
    Alert --> PX
    IPS -->|yes| PX{"Proxy: app-layer<br/>policy allows?"}
    PX -->|no| DPX(["Block at proxy (log)"])
    PX -->|yes| HF{"Host firewall:<br/>local rule allows?"}
    HF -->|no| DHF(["Drop at host firewall"])
    HF -->|yes| EDRc{"EDR: process<br/>behaviour benign?"}
    EDRc -->|no| Quar(["Kill / quarantine<br/>process, isolate host"])
    EDRc -->|yes| OK(["Allow - request handled,<br/>flow logged at each layer"])

    %% outbound chain (egress)
    Dir -->|outbound| Egr{"Egress: destination<br/>allowed?"}
    Egr -->|"no (C2 / unknown)"| DEG(["Block egress, alert -<br/>C2 / exfil contained"])
    Egr -->|yes| OUT(["Permit outbound<br/>(logged)"])
```
