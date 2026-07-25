---
title: "Secretless Instance Identity — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secretless Instance Identity — Decision Flowchart

Request validation and SSRF-defense gates, from the metadata call to credential use, with
explicit deny terminals.

```mermaid
flowchart TD
    Start(["Workload needs credentials"]) --> Ver{"Which metadata protocol?"}
    Ver -->|AWS IMDSv2| PutTok["PUT for session token<br/>(TTL header)"]
    Ver -->|GCP / Azure| Hdr["GET with required header<br/>(Metadata-Flavor / Metadata: true)"]
    Ver -->|AWS IMDSv1| V1{"IMDSv1 still enabled?"}

    V1 -->|No| ErrV1(["Denied: IMDSv1 disabled - use v2"])
    V1 -->|Yes| Reach

    PutTok --> TokOK{"Session token issued?"}
    TokOK -->|No| ErrTok(["Denied: no token - SSRF blocked"])
    TokOK -->|Yes| Reach
    Hdr --> HdrOK{"Required header present?"}
    HdrOK -->|No| ErrHdr(["Denied: 403 header required"])
    HdrOK -->|Yes| Reach

    Reach{"Request from on-instance,<br/>within hop limit?"} -->|No| ErrHop(["Denied: hop-limit / egress rule"])
    Reach -->|Yes| Ident{"Identity attached<br/>to instance?"}
    Ident -->|No| ErrNoId(["404: no role / managed identity"])
    Ident -->|Yes| Mint["IAM mints short-lived<br/>credentials"]
    Mint --> Use["Call Cloud API"]
    Use --> Exp{"Near expiry?"}
    Exp -->|Yes| Ver
    Exp -->|No| Use
```

Notes

- The session-token (AWS) and header (GCP/Azure) gates are the first line against SSRF: a blind GET that cannot set headers or do the `PUT` step never reaches the credential path.
- The hop-limit / egress gate is a defense-in-depth layer for cases where an app on the instance is itself the SSRF vector.
- No attached identity is a clean 404, not an error to retry — the fix is an IAM change, not a client change.
</content>
