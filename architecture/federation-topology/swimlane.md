---
title: "Federation Topology — Hub-and-Spoke Zone Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Federation Topology — Hub-and-Spoke Zone Diagram

The broker sits at the center. Upstream IdPs feed identity in (broker acts as SP);
downstream SPs consume brokered tokens out (broker acts as IdP). One integration per
spoke instead of a full mesh.

```mermaid
flowchart LR
    subgraph Upstream["Upstream Identity Providers (spokes in)"]
        Ent["Enterprise IdP<br/>(SAML / OIDC)"]
        Soc["Social IdP<br/>(OIDC / OAuth)"]
        Part["Partner IdP<br/>(SAML)"]
    end

    subgraph Hub["Identity Broker (Hub / Trust Boundary)"]
        HRD["Home-Realm Discovery"]
        InSP["Inbound edge<br/>(broker as SP / client)"]
        Map["Attribute / Claim Mapper"]
        Reg[("Trust / Metadata Registry<br/>certs, metadata, clients")]
        OutIdP["Outbound edge<br/>(broker as IdP / issuer)"]
    end

    subgraph Downstream["Downstream Service Providers (spokes out)"]
        SP1["SaaS App A"]
        SP2["Internal App B"]
        SP3["Partner Portal C"]
    end

    Ent --> InSP
    Soc --> InSP
    Part --> InSP

    HRD --> InSP
    InSP --> Map
    Map --> OutIdP
    Reg -.->|"trust config"| InSP
    Reg -.->|"trust config"| OutIdP

    OutIdP --> SP1
    OutIdP --> SP2
    OutIdP --> SP3
```

Notes

- Every upstream trusts exactly one relying party (the broker's inbound edge) and every
  downstream trusts exactly one issuer (the broker's outbound edge): **N + M** integrations,
  not **N x M**.
- The **Trust / Metadata Registry** is the control-plane store that both edges read for
  peer certificates, endpoints, and client registrations — the single place key/metadata
  rotation happens.
- The **Claim Mapper** is the only path from the inbound to the outbound edge; nothing
  crosses without normalization, which is where transitive-trust risk is contained.
- Adding a spoke on either side is a single new registration in the hub — the strength and
  the risk of the hub-and-spoke model.
