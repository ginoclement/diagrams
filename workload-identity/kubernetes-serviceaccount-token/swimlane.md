# Kubernetes Projected ServiceAccount Token — Swimlane Diagram

One lane per actor. The kubelet mints and projects the token; the workload exchanges it; the
external system validates against the cluster's OIDC issuer.

```mermaid
flowchart TD
    subgraph Workload["Workload / Pod"]
        W1["Read token from<br/>projected volume path"]
        W2["Present token to<br/>external system"]
        W3(["Call cloud/SaaS API<br/>with issued credential"])
    end

    subgraph Kubelet["Kubelet"]
        K1["Request token via<br/>TokenRequest API"]
        K2["Project token into<br/>mounted file"]
        K3["Refresh at ~80% TTL,<br/>rewrite file"]
    end

    subgraph API["kube-apiserver"]
        A1["Mint signed OIDC JWT<br/>(aud, exp, bound to Pod)"]
        A2["Serve OIDC discovery<br/>+ JWKS"]
    end

    subgraph External["External system"]
        E1["Verify iss, aud, sig, exp"]
        E2{"Subject mapped<br/>to a role/policy?"}
        E3["Issue short-lived<br/>credential"]
        E4["Deny - no credential"]
    end

    K1 --> A1 --> K2 --> W1
    W1 --> W2 --> E1 --> E2
    E2 -->|Yes| E3 --> W3
    E2 -->|No| E4
    E1 -.->|"fetch keys"| A2
    K3 -.-> A1
```

Notes

- The kubelet lane is the only one that talks to the TokenRequest API; the workload never
  mints its own token.
- The External lane verifies against the API server's OIDC endpoints (`A2`), not against a
  shared secret — that is what makes the exchange keyless.
- The `E2` gate is where a token with a valid signature but an unmapped subject is denied —
  see [flowchart.md](flowchart.md) for the full gate set.

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
