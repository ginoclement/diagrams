# Network Segmentation and the DMZ — Decision Flowchart

How a packet is evaluated as it tries to cross each boundary. Every boundary is
default-deny; only explicitly allowed source/destination/port flows pass.

```mermaid
flowchart TD
    Start(["Packet arrives<br/>at a boundary"]) --> Dir{"Direction?"}

    Dir -->|"north-south<br/>(Internet to DMZ)"| Edge{"Dest is a published<br/>service on 80/443?"}
    Edge -->|no| DropE(["DROP at edge firewall"])
    Edge -->|yes| Waf{"WAF verdict clean?<br/>(see reverse-proxy-waf)"}
    Waf -->|no| DropW(["Block: malicious request"])
    Waf -->|yes| InAllow{"Internal FW: DMZ to<br/>App-tier flow permitted?"}
    InAllow -->|no| DropI(["DROP: no rule<br/>DMZ to App"])
    InAllow -->|yes| AppOK(["Deliver to app tier"])

    Dir -->|"App to Data"| DataAllow{"Source is app tier AND<br/>dest DB port permitted?"}
    DataAllow -->|no| DropD(["DROP: only app tier<br/>may reach data tier"])
    DataAllow -->|yes| DbOK(["Deliver to database"])

    Dir -->|"east-west<br/>(peer to peer)"| Micro{"Micro-seg policy allows<br/>this exact workload flow?"}
    Micro -->|no| DropL(["DROP: lateral<br/>movement blocked"])
    Micro -->|yes| PeerOK(["Allow scoped<br/>service-to-service flow"])

    Dir -->|"management"| Mgmt{"Source is the bastion<br/>AND admin authenticated (MFA)?"}
    Mgmt -->|no| DropM(["DROP: no direct<br/>admin access to hosts"])
    Mgmt -->|yes| MgmtOK(["Brokered SSH/RDP<br/>(session recorded)"])
```
