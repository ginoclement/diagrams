# Remote Access VPN — Swimlane

Zones from the untrusted endpoint through the gateway into the trusted network. The
gateway is the choke point where auth, MFA, and posture converge before any internal
route is pushed.

```mermaid
flowchart TD
    subgraph Endpoint["Remote endpoint (untrusted)"]
        C1["VPN client<br/>(IKEv2 or TLS VPN)"]
        C2["Posture agent<br/>(encryption, patch, EDR)"]
        C3{"Tunnel mode?"}
        C4["Split: corporate<br/>subnets only"]
        C5["Full: all traffic<br/>via gateway"]
    end

    subgraph Edge["Perimeter"]
        G1["VPN gateway /<br/>concentrator"]
        G2{"Auth + MFA OK?"}
        G3{"Posture compliant?"}
        G4["Establish tunnel,<br/>push routes/DNS"]
        G5(["Reject connection"])
    end

    subgraph AuthZone["Identity"]
        I1["IdP / MFA<br/>(RADIUS / SAML / OIDC)"]
    end

    subgraph Quarantine["Quarantine VLAN"]
        Q1["Remediation /<br/>patch services only"]
    end

    subgraph Trusted["Internal / Trusted"]
        R1["Internal firewalls<br/>+ segmentation"]
        R2["Apps / data<br/>(still gated)"]
    end

    C1 --> G1 --> G2
    C2 --> G3
    G2 -->|no| G5
    I1 --> G2
    G2 -->|yes| G3
    G3 -->|"no"| Q1
    G3 -->|yes| G4
    G4 --> C3
    C3 -->|split| C4
    C3 -->|full| C5
    C4 --> R1
    C5 --> R1
    R1 --> R2
```
