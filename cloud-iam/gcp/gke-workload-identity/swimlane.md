# GKE Workload Identity — Swimlane Diagram

One lane per actor. The Metadata lane hides the STS + IAM Credentials work from the pod.

```mermaid
flowchart TD
    subgraph Pod["Pod (client library / ADC)"]
        P1["Request default token<br/>from metadata server"]
        P2["Call Google API<br/>with returned token"]
        P3(["Authorized as GSA / principal"])
    end

    subgraph KSA["Kubernetes SA"]
        K1["Projected token mounted<br/>in pod, kubelet-rotated"]
    end

    subgraph Metadata["GKE Metadata Server"]
        M1["Read projected KSA token"]
        M2["Exchange at STS"]
        M3["Call generateAccessToken for GSA"]
        M4["Return token to pod"]
        M5["Return 403 / 404"]
    end

    subgraph STS["Google STS"]
        S1["Validate KSA JWT,<br/>issue federated token"]
    end

    subgraph IAMCreds["IAM Credentials API"]
        I1{"KSA has<br/>workloadIdentityUser<br/>on GSA?"}
        I2["Mint GSA access token"]
    end

    subgraph GSA["Google SA"]
        G1["Identity used against APIs"]
    end

    P1 --> M1
    K1 --> M1
    M1 --> M2 --> S1 --> M3 --> I1
    I1 -->|No| M5
    I1 -->|Yes| I2 --> G1 --> M4 --> P2 --> P3
```

Notes

- The pod's only action is a plain metadata HTTP GET; everything from `M2` onward is transparent
  to the application.
- The `workloadIdentityUser` binding at `I1` is the pivotal grant — without it the flow fails at
  the metadata server.
- In the direct `principal://` model the GSA lane collapses: the federated token from `S1` is
  returned to the pod and IAM authorizes the `principal://` identity itself.
