---
title: "STS AssumeRole — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# STS AssumeRole — Swimlane Diagram

One lane per actor. The two policy evaluations live in the IAM lane; the credential mint
lives in the STS lane.

```mermaid
flowchart TD
    subgraph Caller["Caller (IAM user/role)"]
        C1["Call AssumeRole<br/>(RoleArn, RoleSessionName)"]
        C2["Receive temporary credentials"]
        C3["Sign API request (SigV4)<br/>with SessionToken"]
        C4(["Use protected resource"])
    end

    subgraph STS
        T1["Receive AssumeRole request"]
        T2["Mint temp credentials scoped to role"]
        T3["Apply session policy intersection"]
        T4["Return Credentials + AssumedRoleUser ARN"]
    end

    subgraph IAM["IAM (policy engine)"]
        M1{"Caller identity policy allows<br/>sts:AssumeRole on RoleArn?"}
        M2{"Role trust policy allows<br/>this Principal + conditions?"}
        M3(["AccessDenied"])
    end

    subgraph Role["Target role"]
        R1["Permissions policies define<br/>max granted actions"]
        R2["MaxSessionDuration caps duration"]
    end

    subgraph API["Target API"]
        P1["Authorize action vs role permissions"]
        P2["Return result"]
    end

    C1 --> T1 --> M1
    M1 -->|No| M3
    M1 -->|Yes| M2
    M2 -->|No| M3
    M2 -->|Yes| R1 --> R2 --> T2 --> T3 --> T4 --> C2
    C2 --> C3 --> P1 --> P2 --> C4
```

Notes

- Both `M1` and `M2` must pass; the trust policy (`M2`) is the account-B-side gate in
  cross-account scenarios.
- `R2` (`MaxSessionDuration`) bounds the requested `DurationSeconds`; exceeding it is a
  validation error before any credential is minted.
- The session-policy step (`T3`) can only shrink permissions — see
  [flowchart.md](./flowchart.md).
