# Secretless Instance Identity — Swimlane Diagram

One lane per actor. The credential handoff never leaves the instance boundary except as
short-lived tokens used against the Cloud API.

```mermaid
flowchart TD
    subgraph Workload
        W1["PUT for session token (AWS v2)<br/>or GET with identity header"]
        W2["GET credentials / token"]
        W3["Cache + refresh before expiry"]
        W4(["Call Cloud API"])
    end

    subgraph IMDS
        M1{"IMDSv2 token or<br/>required header present?"}
        M2["Resolve attached identity"]
        M3["Return short-lived credentials"]
        M4["Reject: 403 / 404"]
    end

    subgraph IAM["Cloud IAM"]
        I1["Mint STS creds / access token<br/>for the instance identity"]
    end

    subgraph API["Cloud API"]
        P1["Authorize token, return data"]
    end

    W1 --> M1
    M1 -->|No| M4
    M1 -->|Yes| W2 --> M2 --> I1 --> M3 --> W3 --> W4 --> P1
```

Notes

- The `M1` gate is the SSRF defense: without the IMDSv2 session token (AWS) or the identity header (GCP/Azure), the request is rejected before any credential is minted.
- If no identity is attached, `M2` finds nothing and the request returns 404 — see the terminal in [flowchart.md](flowchart.md).
- Credentials are cached and refreshed by the workload (`W3`); the metadata service is polled again before expiry rather than holding a durable secret.
</content>
