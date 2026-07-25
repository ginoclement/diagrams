# GKE Workload Identity — Decision Flowchart

Annotation, binding, and token-exchange decisions with explicit failure terminals.

```mermaid
flowchart TD
    Start(["Pod calls the GKE metadata server for a token"]) --> WI{"Workload Identity<br/>enabled on cluster<br/>and node pool?"}
    WI -->|No| E1(["Metadata returns node SA or fails<br/>(legacy, discouraged)"])
    WI -->|Yes| Map{"KSA mapped to an identity?"}

    Map -->|"No annotation / no binding"| E2(["404: no service account for KSA<br/>(no node-SA fallback)"])
    Map -->|"Yes"| Model{"Mapping model?"}

    Model -->|"KSA annotated to GSA"| Ann["Exchange KSA token at STS,<br/>then generateAccessToken(GSA)"]
    Model -->|"Direct principal://"| Dir["Exchange KSA token at STS<br/>for principal:// identity"]

    Ann --> Bind{"KSA member has<br/>workloadIdentityUser on GSA?"}
    Bind -->|No| E3(["403: cannot impersonate GSA"])
    Bind -->|Yes| Tok(["Short-lived GSA token returned to pod"])

    Dir --> RB{"principal:// granted<br/>a role on the target?"}
    RB -->|No| E4(["403: no binding for principal"])
    RB -->|Yes| Tok2(["Federated token returned to pod"])

    Tok --> Call(["Pod calls Google API, authorized by GSA IAM"])
    Tok2 --> Call
```

Notes

- With Workload Identity enabled, an unmapped KSA fails closed at `E2`; the node's service
  account is deliberately not offered to pods.
- The GSA model requires the `workloadIdentityUser` grant; the direct model instead needs a role
  on the `principal://` identity — see [IAM Policy Evaluation](../iam-policy-evaluation/README.md).
- All success paths yield short-lived tokens, never a mounted key file.
