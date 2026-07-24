# SCIM 2.0 Provisioning — Swimlane Diagram

One lane per actor: the SCIM client (IdP/IGA), the service provider (app), and its backing
store. Arrows are the HTTP calls and their responses.

```mermaid
flowchart TD
    subgraph IdP["IdP / IGA (SCIM Client)"]
        C1["POST /Users (create)"]
        C2["GET /Users?filter (reconcile)"]
        C3["PATCH /Users/{id} (partial update)"]
        C4["PATCH /Groups/{id} (membership)"]
        C5["DELETE or active=false (deprovision)"]
        C6["Back off on 429, retry"]
    end

    subgraph SP["App (SCIM Service Provider)"]
        S1["Validate schema + required attrs"]
        S2{"userName / externalId<br/>already exists?"}
        S3["Apply create / update / delete"]
        S4{"Over rate limit?"}
        S5["Return 2xx + resource"]
        S6["Return 409 uniqueness"]
        S7["Return 429 + Retry-After"]
    end

    subgraph Store["Identity Store"]
        D1["Uniqueness check"]
        D2["Persist record change"]
    end

    C1 --> S1 --> S4
    S4 -->|yes| S7 --> C6 --> C1
    S4 -->|no| S2
    S2 --> D1
    D1 -->|exists| S6 --> C2 --> C3
    D1 -->|new| S3 --> D2 --> S5
    C3 --> S3
    C4 --> S3
    C5 --> S3
```

Related: [README](README.md) | [Sequence](sequence.md) | [Flowchart](flowchart.md)
