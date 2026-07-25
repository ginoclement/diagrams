---
title: "ReBAC / Zanzibar — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ReBAC / Zanzibar — Decision Flowchart

How a single Check(object, relation, user) is evaluated: direct tuple, userset rewrites, group
membership, and parent inheritance, with recursion bounds. Deny terminals are explicit.

```mermaid
flowchart TD
    Start(["Check(object, relation, user)"]) --> Snap{"Zookie supplied?"}
    Snap -->|Yes| Fresh["Resolve at snapshot<br/>>= zookie timestamp"]
    Snap -->|No| Bounded["Resolve at bounded-staleness<br/>snapshot (fast path)"]
    Fresh --> Direct
    Bounded --> Direct

    Direct{"Direct tuple<br/>object#relation@user<br/>exists?"}
    Direct -->|Yes| Allow(["allowed = true"])
    Direct -->|No| Rewrite{"Schema rewrite for<br/>this relation?<br/>(e.g. viewer = viewer + editor)"}

    Rewrite -->|Yes| Union["Evaluate each rewrite term:<br/>computed relation, union, exclusion"]
    Union --> UnionHit{"Any term<br/>proves relation?"}
    UnionHit -->|Yes| Allow
    UnionHit -->|No| Group

    Rewrite -->|No| Group{"Relation held by a<br/>userset (group#member)?"}
    Group -->|Yes| GMember{"user is member<br/>of that userset?"}
    GMember -->|Yes| Allow
    GMember -->|No| Parent
    Group -->|No| Parent

    Parent{"Schema inherits from<br/>parent->relation?"}
    Parent -->|No| Deny(["allowed = false<br/>(no relating path)"])
    Parent -->|Yes| Depth{"Recursion depth<br/>within limit?"}
    Depth -->|No| DenyDepth(["Deny: depth cap hit<br/>(cycle / too deep)"])
    Depth -->|Yes| Walk["Check(parent_object, relation, user)"] --> Direct
```

Notes

- Evaluation **short-circuits** on the first path that proves the relation; only an exhausted search
  yields `allowed = false`. There is no ambient "deny" — deny is the absence of any relating path.
- **Exclusion** rewrites (`viewer = viewer - banned`, where supported) can turn a would-be allow
  into a deny; evaluate them within the union term, not as a separate ambient rule.
- The **depth cap** and cycle detection bound Check cost — pathological parent chains or mutually
  recursive groups must terminate, both for latency and to prevent denial-of-service.
- The zookie choice at the top trades latency for freshness; after a revoke, always take the
  `>= zookie` path so the deny is guaranteed visible.
