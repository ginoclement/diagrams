---
title: "RBAC — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# RBAC — Swimlane Diagram

One lane per actor. The RBAC store lane resolves roles and permissions; the PEP enforces the result.

```mermaid
flowchart TD
    subgraph User
        U1["Request action on resource"]
        U2(["Receive allow or deny"])
    end

    subgraph PEP["PEP (App)"]
        P1["Extract subject + requested<br/>action + resource type"]
        P2["Ask store: any active role<br/>grant this permission?"]
        P3{"Granted?"}
        P4["Forward request to resource"]
        P5["Return 403 Forbidden"]
    end

    subgraph Store["RBAC Store"]
        S1["Look up user role assignments"]
        S2["Expand role hierarchy<br/>(senior inherits junior)"]
        S3["Collect effective permissions<br/>for active roles"]
        S4["Match against requested permission"]
    end

    subgraph API["Resource"]
        R1["Execute action, return data"]
    end

    U1 --> P1 --> P2 --> S1 --> S2 --> S3 --> S4 --> P3
    P3 -->|Yes| P4 --> R1 --> U2
    P3 -->|No| P5 --> U2
```

Notes

- `S2` is the hierarchy expansion: a `Manager` role that is senior to `Analyst` picks up every
  `Analyst` permission before matching.
- Only **active** roles feed `S3` — constrained-RBAC session activation is upstream of this check
  and is where Dynamic Separation of Duty is enforced (see [flowchart.md](./flowchart.md)).
- The store is typically a cached, in-memory projection; a slow round trip per request is the main
  performance pitfall at scale.
