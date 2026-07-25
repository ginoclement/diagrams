---
title: "Zero Trust Architecture — Control / Data Plane Zone Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Zero Trust Architecture — Control / Data Plane Zone Diagram

Components split into the untrusted access zone, the data-plane enforcement path, the
control-plane PDP, and the signal sources. The dashed lines are decision/signal flows;
solid lines are the data path. Note there is no trusted "internal network" zone.

```mermaid
flowchart TD
    subgraph Access["Access Zone (no implicit trust)"]
        Subject["Subject (user / workload)"]
        Device["Device / Endpoint"]
    end

    subgraph DataPlane["Data Plane (enforcement)"]
        PEP["Policy Enforcement Point (PEP)"]
    end

    subgraph ControlPlane["Control Plane (PDP)"]
        PE["Policy Engine (PE)"]
        PA["Policy Administrator (PA)"]
        Store[("Policy store<br/>rules, roles, entitlements")]
    end

    subgraph Signals["Signal Sources"]
        IdP["Identity / IdP"]
        Posture["Device Posture / EDR"]
        Risk["Threat / Risk Signals<br/>(SIEM, behavior, geo)"]
    end

    subgraph Protected["Protected Resources"]
        Res["Application / API / Data"]
    end

    Subject --> Device
    Device -->|request| PEP
    PEP -.->|authorization query| PE
    PE -.->|read policy| Store
    PE -.->|identity| IdP
    PE -.->|posture| Posture
    PE -.->|risk| Risk
    PE -.->|decision| PA
    PA -.->|"establish / revoke session"| PEP
    PEP -->|authorized path only| Res
    Res -->|response| PEP
    PEP --> Device
```

Notes

- **No perimeter zone exists.** Every request from the Access Zone hits a PEP; there is no
  "inside" that is trusted by virtue of network position.
- **Control plane (dashed) never touches application data.** The PE decides and the PA
  establishes/revokes; only the PEP (data plane, solid) carries the request to the resource.
- **Every decision fans out to the signal sources.** Identity, device posture, and risk are
  independent inputs — combined per request, never cached into standing trust.
- The **Policy store** is the authoritative rule set the PE evaluates; changing policy there
  changes every subsequent decision without touching the enforcement path.
