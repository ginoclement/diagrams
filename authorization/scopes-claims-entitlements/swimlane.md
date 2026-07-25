# Scopes, Claims, Entitlements — Swimlane Diagram

One lane per actor. The IdP stamps scopes and claims at token time; the gateway does the coarse
scope check; the resource resolves the fine-grained entitlement against live policy/data.

```mermaid
flowchart TD
    subgraph User
        U1["Authenticate + consent<br/>to requested scopes"]
        U2(["Receive allow or deny"])
    end

    subgraph Client
        C1["Request token with scopes"]
        C2["Call API with access token"]
    end

    subgraph IdP["IdP (AuthZ Server)"]
        I1["Mint access token:<br/>scope + roles/tenant/acr claims"]
        I2["Issue ID token (identity claims)"]
    end

    subgraph GW["API Gateway (PEP)"]
        G1["Validate token<br/>(iss, aud, sig, exp)"]
        G2{"Route scope<br/>present?"}
        G3["Reject: insufficient_scope"]
        G4["Forward + subject claims"]
    end

    subgraph API["Resource"]
        R1["Resolve entitlement:<br/>subject + action + this object"]
        R2{"Entitled?"}
        R3["Execute action"]
        R4["Deny: object-level 403"]
    end

    subgraph Data["Policy / Data"]
        D1["Live roles, relationships,<br/>ownership, attributes"]
    end

    U1 --> I1 --> I2 --> C1 --> C2
    C2 --> G1 --> G2
    G2 -->|No| G3 --> U2
    G2 -->|Yes| G4 --> R1
    R1 --> D1 --> R2
    R2 -->|Yes| R3 --> U2
    R2 -->|No| R4 --> U2
```

Notes

- **Coarse vs fine boundary** is the `GW → API` handoff: the gateway only knows scopes and token
  claims, the resource re-decides against live data (`D1`) for the specific object.
- The IdP lane runs **once at token time**; the gateway and resource lanes run **per request** for
  the token's whole lifetime, which is why revocation must be re-checked at the resource.
- ID-token claims (`I2`) are for **identity**, not for the access decision — the entitlement uses the
  access token's authorization context plus live data.
