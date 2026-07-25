---
title: "Breached Password Detection — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Breached Password Detection — Swimlane

One lane per actor. Steps sit in the lane of the actor performing them; arrows
cross lanes at handoffs.

```mermaid
flowchart TD
    subgraph User
        U1["Enter candidate password"]
    end

    subgraph Browser
        B1["POST candidate<br/>over TLS"]
    end

    subgraph IdP
        I1["Compute SHA1(candidate)"]
        I2["Split prefix (5) + suffix (35)"]
        I3["Send prefix to range API"]
        I4["Scan returned suffixes<br/>locally for our suffix"]
        I5{"Suffix found?"}
        I6{"Breach count ><br/>threshold?"}
        I7["Run policy + history checks"]
        I8["Store with slow<br/>salted hash"]
        I9["Reject: password<br/>found in breach corpus"]
    end

    subgraph BreachAPI
        A1["Return all suffixes +<br/>counts for prefix<br/>(padded response)"]
    end

    subgraph Directory
        D1["Persist bcrypt/argon2 hash"]
    end

    U1 --> B1 --> I1 --> I2 --> I3 --> A1
    A1 --> I4 --> I5
    I5 -->|no| I7 --> I8 --> D1
    I5 -->|yes| I6
    I6 -->|yes| I9
    I6 -->|no| I7
```
