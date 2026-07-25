# IMDSv2 Instance Credentials — Swimlane Diagram

One lane per actor. The token handshake and credential fetch span the App and IMDS lanes; the
minting lives in the STS lane.

```mermaid
flowchart TD
    subgraph App["App (SDK on instance)"]
        A1["PUT /latest/api/token (TTL header)"]
        A2["Receive session token"]
        A3["GET credentials with token header"]
        A4["Sign API request (SigV4)"]
        A5(["Use AWS resource"])
    end

    subgraph IMDS["IMDS 169.254.169.254"]
        D1{"HttpTokens=required<br/>and token valid?"}
        D2(["401 Unauthorized"])
        D3["Resolve attached role"]
        D4["Return JSON credentials"]
    end

    subgraph Profile["Instance profile"]
        F1{"Role attached?"}
        F2(["404 Not Found"])
        F3["Provide RoleName"]
    end

    subgraph STS["STS"]
        S1["Mint / refresh temporary credentials"]
    end

    subgraph API["AWS Service"]
        P1["Authorize action vs role permissions"]
        P2["Return result"]
    end

    A1 --> A2 --> A3 --> D1
    D1 -->|No| D2
    D1 -->|Yes| F1
    F1 -->|No| F2
    F1 -->|Yes| F3 --> D3 --> S1 --> D4 --> A4
    A4 --> P1 --> P2 --> A5
```

Notes

- `D1` enforces IMDSv2, a token-less `GET` fails here when `HttpTokens=required`.
- `F1` is the 404 branch when no instance profile is attached.
- `HttpPutResponseHopLimit=1` keeps the token in the App lane, it cannot be relayed off-host.
