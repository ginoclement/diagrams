# Identity-Aware Proxy — Swimlane Diagram

One lane per actor. The IAP lane gates every request before the Backend lane is reached.

```mermaid
flowchart TD
    subgraph User
        U1["Open protected app"]
        U2(["See app or 403"])
    end

    subgraph Browser
        B1["GET app via load balancer"]
        B2["Sign in at Google if prompted"]
        B3["Retry with IAP session cookie"]
    end

    subgraph IAP["Identity-Aware Proxy"]
        P1{"Valid IAP<br/>session?"}
        P2{"Has<br/>iap.httpsResourceAccessor?"}
        P3{"Access levels<br/>satisfied?"}
        P4["Forward + signed IAP JWT"]
        P5["403 Forbidden"]
    end

    subgraph Google["Google Sign-In"]
        G1["Authenticate user, set session"]
    end

    subgraph ACM["Access Context Manager"]
        A1["Evaluate device / IP / region"]
    end

    subgraph Backend["Backend app"]
        K1["Verify JWT (iss, aud, exp)"]
        K2["Serve response"]
    end

    U1 --> B1 --> P1
    P1 -->|No| G1 --> B2 --> B3 --> P1
    P1 -->|Yes| P2
    P2 -->|No| P5 --> U2
    P2 -->|Yes| P3
    P3 --> A1 --> P3
    P3 -->|No| P5
    P3 -->|Yes| P4 --> K1 --> K2 --> U2
```

Notes

- All three gates (`P1` auth, `P2` IAM role, `P3` access level) live in the IAP lane; only after
  all pass does traffic cross into the Backend lane.
- The Backend still verifies the signed JWT at `K1`, so trust is not assumed from network position.
- A `P3` denial is context-aware access at work — identity alone is insufficient without a
  satisfying device/location posture.
