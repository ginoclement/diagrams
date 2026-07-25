# AssumeRoleWithWebIdentity — Swimlane Diagram

One lane per actor. The JWT crosses from the IdP through the workload to STS; STS pulls
JWKS back from the IdP to verify it.

```mermaid
flowchart TD
    subgraph Job["Workload (CI job)"]
        J1["Request OIDC token from IdP"]
        J2["Call AssumeRoleWithWebIdentity<br/>with the JWT"]
        J3["Receive temp credentials"]
        J4(["Deploy with SigV4-signed calls"])
    end

    subgraph IdP["OIDC IdP (GitHub)"]
        D1["Issue signed JWT<br/>(iss, aud, sub, exp)"]
        D2["Serve JWKS public keys"]
    end

    subgraph STS
        T1["Verify JWT signature via JWKS"]
        T2["Check iss, aud, exp"]
        T3["Mint temporary credentials"]
    end

    subgraph IAM["IAM"]
        M1{"iss registered as OIDC provider<br/>and aud in ClientIDList?"}
        M2{"Trust policy sub / aud<br/>conditions satisfied?"}
        M3(["AccessDenied"])
    end

    subgraph Role["Target role"]
        R1["Permissions bound the deploy session"]
    end

    J1 --> D1 --> J2 --> T1
    D2 --> T1
    T1 --> T2 --> M1
    M1 -->|No| M3
    M1 -->|Yes| M2
    M2 -->|No| M3
    M2 -->|Yes| R1 --> T3 --> J3 --> J4
```

Notes

- `M1` is the provider-registration and `aud` gate; `M2` is the fine-grained `sub`/`aud`
  claim gate. Both live in the AWS account IAM lane.
- The workload never holds a long-lived AWS key — the only secret is the short-lived JWT,
  which it did not store either.
- Scoping `sub` tightly at `M2` is what stops other repos, branches, or forks from
  assuming the same role.
