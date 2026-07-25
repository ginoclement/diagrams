---
title: "Breached Password Detection — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Breached Password Detection — Decision Flowchart

Branch-focused view: the k-anonymity range query, local suffix match, the
breach-count threshold decision, API-failure handling, and the offline
bloom-filter alternative.

```mermaid
flowchart TD
    Start(["Candidate password<br/>submitted over TLS"]) --> Mode{"Online API or<br/>offline bloom filter?"}

    %% ----- offline variant -----
    Mode -->|offline| Bloom{"SHA1 present in<br/>local bloom filter?"}
    Bloom -->|possibly| EBloom(["Reject:<br/>likely breached"])
    Bloom -->|definitely not| Policy

    %% ----- online k-anonymity variant -----
    Mode -->|online| Hash["Compute SHA1(candidate),<br/>split prefix (5) + suffix (35)"]
    Hash --> Query["GET range for prefix<br/>(padded, no full hash sent)"]
    Query --> ApiOk{"API responded?"}
    ApiOk -->|no| FailMode{"Fail closed?"}
    FailMode -->|yes| EFail(["Reject:<br/>cannot verify, blocked"])
    FailMode -->|no| Policy
    ApiOk -->|yes| Match{"Our suffix in<br/>returned list?"}
    Match -->|no| Policy{"Meets policy +<br/>history checks?"}
    Match -->|yes| Thresh{"Breach count ><br/>threshold?"}
    Thresh -->|yes| EBreach(["Reject:<br/>choose a different password"])
    Thresh -->|no| Policy

    Policy -->|no| EPolicy(["Reject:<br/>fails policy / history"])
    Policy -->|yes| Store["Store with slow<br/>salted hash"]
    Store --> Done(["Password accepted"])
```
