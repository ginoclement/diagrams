---
title: "SPIFFE / SPIRE Issuance — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# SPIFFE / SPIRE Issuance — Swimlane Diagram

One lane per actor. The node-attestation handoff (Agent to Server) precedes any
workload-attestation handoff (Workload to Agent to Server).

```mermaid
flowchart TD
    subgraph Workload
        W1["Connect to Workload API socket"]
        W2["Receive X.509-SVID + trust bundle"]
        W3(["Use SVID for mTLS"])
        W4["Request JWT-SVID for an audience"]
    end

    subgraph Agent["SPIRE Agent"]
        A1["Gather node evidence"]
        A2["Attest node to server"]
        A3["Read peer PID from UDS,<br/>run workload attestors"]
        A4["Match selectors to entries"]
        A5["Forward CSR for SPIFFE ID"]
        A6["Deliver SVID over socket"]
    end

    subgraph Server["SPIRE Server"]
        S1["Verify node evidence,<br/>derive node selectors"]
        S2["Issue agent SVID + entries"]
        S3{"Selectors match a<br/>registration entry?"}
        S4["Sign leaf: SPIFFE ID in URI SAN,<br/>short TTL"]
        S5["No identity issued"]
    end

    subgraph Attestor["Attestor / IID service"]
        T1["Issue signed node<br/>attestation document"]
    end

    A1 --> T1 --> A2 --> S1 --> S2 --> A3
    W1 --> A3 --> A4 --> S3
    S3 -->|Yes| A5 --> S4 --> A6 --> W2 --> W3
    S3 -->|No| S5
    W4 -.->|"FetchJWTSVID"| A5
```

Notes

- Node attestation happens once at agent startup; workload attestation happens on every Workload API call.
- The `S3` decision is where a workload with no matching entry is silently denied — see [flowchart.md](flowchart.md) for the full gate set.
- JWT-SVID requests reuse the same signing path (`A5` onward) but yield a JWT bound to a named `aud` instead of an X.509 leaf.
</content>
