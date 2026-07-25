---
title: "Managed Identity via IMDS — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Managed Identity via IMDS — Swimlane Diagram

One lane per actor. Token acquisition spans the App and IMDS lanes; issuance is in the Entra lane.

```mermaid
flowchart TD
    subgraph App["App (on Azure resource)"]
        A1["GET IMDS token endpoint<br/>(resource, Metadata: true)"]
        A2{"System- or<br/>user-assigned?"}
        A3["Add client_id / object_id / mi_res_id"]
        A4["Receive access_token"]
        A5["Call API with Bearer token"]
        A6(["Use protected resource"])
    end

    subgraph IMDS["Azure IMDS"]
        D1{"Metadata: true header<br/>present?"}
        D2(["400 Bad Request"])
        D3{"Identity resolved<br/>unambiguously?"}
        D4(["400 specify identity"])
    end

    subgraph Entra["Microsoft Entra ID"]
        E1["Mint access_token for the identity"]
        E2["Validate token on API call<br/>(JWKS, iss, aud, exp)"]
    end

    subgraph API["Protected API"]
        P1["Authorize via RBAC role assignment"]
        P2["Return result"]
    end

    A1 --> A2
    A2 -->|System| D1
    A2 -->|User| A3 --> D1
    D1 -->|No| D2
    D1 -->|Yes| D3
    D3 -->|No| D4
    D3 -->|Yes| E1 --> A4 --> A5 --> E2 --> P1 --> P2 --> A6
```

Notes

- `D1` is the SSRF guard, `D3` is the user-assigned disambiguation gate.
- The token is a normal Entra access token, the API validates it against Entra's JWKS (`E2`).
- Authorization on the API side (`P1`) is Azure RBAC on the target resource, separate from token
  issuance.
