---
title: "Secrets Broker with Dynamic Credentials — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Secrets Broker with Dynamic Credentials — Swimlane Diagram

One lane per actor. The Broker lane owns the lease lifecycle; the Backend lane is where the
ephemeral principal is created and later destroyed.

```mermaid
flowchart TD
    subgraph Client
        C1["Authenticate with workload identity"]
        C2["Use minted credential"]
        C3["Renew lease (optional)"]
        C4(["Request denied"])
    end

    subgraph Broker
        B1["Verify identity"]
        B2{"Entitled to<br/>requested role?"}
        B3["Issue lease + TTL"]
        B4{"Renew within<br/>max TTL?"}
        B5["Revoke at expiry<br/>or on demand"]
    end

    subgraph Backend
        K1["Create ephemeral principal<br/>(scoped grants)"]
        K2["Delete ephemeral principal"]
    end

    subgraph Resource
        R1["Serve access while credential valid"]
        R2(["Reject - credential dead"])
    end

    C1 --> B1 --> B2
    B2 -->|"No"| C4
    B2 -->|"Yes"| K1 --> B3 --> C2 --> R1
    C3 --> B4
    B4 -->|"Yes"| B3
    B4 -->|"No - max TTL reached"| B5
    B3 --> B5 --> K2 --> R2
```

Notes

- `B2` is the entitlement gate, a denial ends at `C4` and no ephemeral principal is ever
  created in the Backend lane.
- Every credential in the Resource lane traces to exactly one `K1` create and one `K2`
  delete, so per-lease attribution and instant revocation both fall out for free.
- Renewal (`B4`) loops back to extend the same lease until the hard `max TTL`, after which
  the only path forward is a brand-new request from `C1`.
