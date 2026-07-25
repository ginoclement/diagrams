# Entra Workload Identity Federation — Swimlane Diagram

One lane per actor. The assertion is minted in the ExtIdP lane and verified in the Entra lane;
no secret ever lives in the Workload lane.

```mermaid
flowchart TD
    subgraph Workload["Workload (external job)"]
        W1["Request OIDC token from platform<br/>(aud=api://AzureADTokenExchange)"]
        W2["POST assertion to Entra token endpoint<br/>(client_credentials + jwt-bearer)"]
        W3["Receive Entra access_token"]
        W4["Call API with Bearer token"]
        W5(["Use protected resource"])
    end

    subgraph ExtIdP["External OIDC issuer"]
        X1["Mint signed JWT<br/>(iss, sub, aud)"]
        X2["Serve OIDC discovery + JWKS"]
    end

    subgraph Entra["Entra token endpoint"]
        E1["Fetch issuer JWKS, verify signature"]
        E2{"iss + sub + aud match a<br/>federated identity credential?"}
        E3(["400 no matching credential"])
        E4["Issue access_token"]
    end

    subgraph API["Protected API"]
        P1["Validate token, authorize via permissions"]
        P2["Return result"]
    end

    W1 --> X1 --> W2 --> E1
    E1 --> X2
    E1 --> E2
    E2 -->|No| E3
    E2 -->|Yes| E4 --> W3 --> W4 --> P1 --> P2 --> W5
```

Notes

- The Workload lane holds no secret, only the short-lived external assertion.
- `E2` is the trust gate — exact `iss`/`sub`/`aud` match against the pinned federated credential.
- Entra pulls the external issuer's JWKS (`X2`) to verify the assertion signature before matching.
