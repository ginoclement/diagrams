---
title: "Diagram Title — Decision Flowchart"
creation: 2026-01-01
lastUpdate: 2026-01-01
reviewed: false
deprecated: false
---

# Diagram Title — Decision Flowchart

Decision logic with explicit deny/error terminals.

```mermaid
flowchart TD
    Start(["Request received"]) --> Check{"Valid?"}
    Check -->|No| Deny(["Reject with error"])
    Check -->|Yes| Do["Perform action"]
    Do --> Done(["Success"])
```
