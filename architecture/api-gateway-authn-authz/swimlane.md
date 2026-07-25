---
title: "API Gateway AuthN/AuthZ — Tier Topology Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# API Gateway AuthN/AuthZ — Tier Topology Diagram

The gateway is the only component in the DMZ; microservices live in the application tier
and trust only forwarded gateway identity. The authorization server sits in its own
identity zone the gateway consults for keys and introspection.

```mermaid
flowchart TD
    subgraph Public["Public / Untrusted"]
        Client["Client / SPA / Mobile"]
    end

    subgraph Edge["Edge / DMZ"]
        GW["API Gateway / BFF"]
        RL["Rate Limiter"]
        Val["Token Validator<br/>(JWT verify / introspect)"]
        AuthZ["Authorization<br/>(scope / claim check)"]
    end

    subgraph Identity["Identity Zone"]
        AS["Authorization Server / IdP"]
        JWKS["JWKS Endpoint"]
        Intro["Introspection Endpoint"]
        STS["Token Exchange (STS)"]
    end

    subgraph AppTier["Application Tier (internal only)"]
        SvcA["Microservice A"]
        SvcB["Microservice B"]
    end

    Client -->|HTTPS + bearer token| GW
    GW --> RL --> Val --> AuthZ

    Val -.->|fetch keys| JWKS
    Val -.->|introspect| Intro
    AuthZ -.->|exchange token| STS
    JWKS -.-> AS
    Intro -.-> AS
    STS -.-> AS

    AuthZ -->|"routed + scoped token"| SvcA
    AuthZ -->|"routed + scoped token"| SvcB
    SvcA -->|internal call + exchanged token| SvcB
```

Notes

- The **Public** zone reaches only the gateway; there is no route from a client to a
  microservice, JWKS, or introspection endpoint.
- Validation and authorization happen entirely within the **Edge** before any request is
  routed inward — the gateway is a [PEP](../zero-trust-architecture/README.md) for the app tier.
- Calls into the **Identity Zone** (dashed) are control-plane lookups: key fetch,
  introspection, and token exchange. They carry no application payload.
- Service-to-service calls (SvcA -> SvcB) use their own exchanged tokens, so a compromised
  service cannot replay the original caller's credential across the mesh.
