# OIDC to Cloud Federation — Swimlane Diagram

One lane per component. Cross-lane arrows are the token request, the exchange, and the deploy.
The deprecated stored-key path is drawn as a dashed dead-end branch.

```mermaid
flowchart TD
    subgraph Job["CI Job"]
        J1["Start deploy step"]
        J2["Request OIDC token<br/>with target audience"]
        J3["Call STS exchange<br/>with signed JWT"]
        J4["Deploy with<br/>temporary credentials"]
        JX["Read static access key<br/>from CI secrets"]
    end

    subgraph OIDC["CI OIDC issuer"]
        O1["Build claims<br/>sub, aud, actor, environment"]
        O2["Sign JWT, publish JWKS"]
    end

    subgraph STS["Cloud STS / trust policy"]
        T1["Verify JWT signature via JWKS"]
        T2{"sub + aud match<br/>trust policy?"}
        T3["Issue short-lived credentials"]
        T4(["403 AccessDenied"])
    end

    subgraph Cloud["Cloud APIs"]
        C1(["Deployment applied"])
        CX(["Standing access<br/>until key rotated"])
    end

    J1 --> J2 --> O1 --> O2
    O2 -->|"signed JWT"| J3 --> T1 --> T2
    T2 -->|"Yes"| T3 -->|"temp creds"| J4 --> C1
    T2 -->|"No - wildcard/aud mismatch"| T4

    J1 -.->|"deprecated path"| JX -.->|"long-lived key"| CX
```

Notes

- The `T2` gate is where claim-based trust is enforced; a passing signature at `T1` still
  fails here if the subject or audience does not match.
- The dashed `JX --> CX` branch is the ⛔ deprecated stored-key approach: no expiry, no
  claim scoping — kept here only to contrast with the federated path.
- See [flowchart.md](flowchart.md) for every validation gate and its deny terminal.
