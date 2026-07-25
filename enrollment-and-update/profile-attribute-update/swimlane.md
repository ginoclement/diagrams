---
title: "Profile Attribute Update — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Profile Attribute Update — Swimlane

Lanes for User, Browser, IdP Server, Directory, and Verification Service. The IdP
classifies the attribute and decides which gate applies before anything reaches the
Directory.

```mermaid
flowchart TD
    subgraph User
        U1["Edit an attribute"]
        U2["Re-authenticate<br/>when challenged"]
        U3["Confirm new value"]
    end

    subgraph Browser
        B1["Submit change"]
        B2["Run step-up prompt"]
        B3["Submit verification"]
    end

    subgraph IdP["IdP Server"]
        S1{"Attribute class?"}
        S2["Validate + commit"]
        S3{"Session freshly<br/>authenticated?"}
        S4["Require step-up"]
        S5{"New value is a<br/>contact channel?"}
        S6["Send proof"]
        S7["Promote verified value"]
        S8["403 reject<br/>(admin-restricted)"]
    end

    subgraph Dir["Directory"]
        D1["Store attribute"]
    end

    subgraph VS["Verification Service"]
        V1["Deliver code / link"]
    end

    U1 --> B1 --> S1
    S1 -->|non-sensitive| S2 --> D1
    S1 -->|"admin-restricted"| S8
    S1 -->|sensitive| S3
    S3 -->|no| S4 --> B2 --> U2 --> S3
    S3 -->|yes| S5
    S5 -->|no| S2
    S5 -->|yes| S6 --> V1 --> U3 --> B3 --> S7 --> D1
```
