---
title: "Service-Account Key Lifecycle — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Service-Account Key Lifecycle — Swimlane Diagram

One lane per actor across the issue / store / use / rotate / revoke loop.

```mermaid
flowchart TD
    subgraph Admin
        AD1["Create key"]
        AD2["Store in secret manager"]
        AD3["Create new key (rotation)"]
        AD4["Deactivate then delete old key"]
        AD5["Revoke on compromise"]
    end

    subgraph IAM["Cloud IAM"]
        IA1["Generate keypair / access key,<br/>return secret once"]
        IA2["Validate JWT / SigV4 on use"]
        IA3["Disable / delete key"]
    end

    subgraph Store["Secret Store"]
        ST1["Persist secret with<br/>access policy + audit"]
        ST2["Lease secret to workload"]
        ST3["Hold new + old during overlap"]
    end

    subgraph Workload
        WL1["Read key material"]
        WL2["Sign JWT / SigV4"]
        WL3(["Authenticated call succeeds"])
        WL4["Pick up rotated key"]
    end

    AD1 --> IA1 --> AD2 --> ST1 --> ST2 --> WL1 --> WL2 --> IA2 --> WL3
    AD3 --> ST3 --> WL4 --> AD4 --> IA3
    AD5 --> IA3
```

Notes

- The overlap lane (`ST3`) is what makes rotation safe: the store serves both keys until the workload has switched, then the old key is deleted.
- Deleting the old key before `WL4` picks up the new one is the classic self-inflicted outage — see the outage terminal in [flowchart.md](./flowchart.md).
- Revocation (`AD5 --> IA3`) is the same disable/delete action as the end of rotation, just triggered by compromise instead of schedule.
</content>
