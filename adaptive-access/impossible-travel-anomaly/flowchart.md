---
title: "Impossible Travel / Anomalous Session — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Impossible Travel / Anomalous Session — Decision Flowchart

From a pair of authentication events to an outcome. Feasible travel passes; infeasible
travel is suppressed for VPN context, then routed to step-up or, when compounded, straight
to revoke.

```mermaid
flowchart TD
    S(["Second event arrives for active identity"]) --> Pair{"Two events with<br/>location + time available?"}
    Pair -->|No| Baseline(["Allow: insufficient data,<br/>fall back to base policy"])
    Pair -->|Yes| Vel["Compute velocity:<br/>distance / (t2 - t1)"]

    Vel --> Feasible{"Velocity physically<br/>feasible?"}
    Feasible -->|Yes| Allow(["Allow: session continues"])
    Feasible -->|No| VPN{"Explained by VPN /<br/>known travel / allowlist?"}

    VPN -->|Yes| Allow
    VPN -->|No| Hard{"Compounded with a hard signal?<br/>known-bad IP / leaked credential"}

    Hard -->|Yes| Revoke(["Block + revoke sessions, alert"])
    Hard -->|No| Stepup{"Step-up re-auth<br/>satisfied?"}
    Stepup -->|Yes| Cleared(["Allow: anomaly cleared"])
    Stepup -->|No| Revoke
```

Notes

- `Pair` guards against a single-event false alarm, velocity is undefined without two
  located events, so the flow falls back to base policy rather than inventing an anomaly.
- The `VPN` gate is the false-positive suppressor and runs before any enforcement, an
  infeasible-looking hop through a corporate egress is cleared to `Allow`.
- The two enforcement terminals diverge on confidence: `Hard` short-circuits to `Revoke`,
  while a bare anomaly gets a chance at `Stepup`, and a failed step-up also lands in
  `Revoke` — the flow fails closed.
