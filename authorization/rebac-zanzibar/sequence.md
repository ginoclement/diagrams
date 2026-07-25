# ReBAC / Zanzibar — Sequence Diagram

Happy path first (direct tuple Check), then alternates: userset rewrite (editor implies viewer),
group membership, parent-folder inheritance, Expand, and a consistency-token (zookie) read after a
revoke.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as App (PEP)
    participant Z as Zanzibar (PDP)
    participant Store as Tuple Store

    User->>App: Open document:readme
    App->>Z: Check(document:readme, viewer, user:anna)
    Z->>Store: Lookup tuple document:readme#viewer@user:anna
    Store-->>Z: Found (direct relation)
    Z-->>App: allowed = true
    App-->>User: 200 Render document

    alt Userset rewrite - editor implies viewer
        App->>Z: Check(document:readme, viewer, user:bob)
        Z->>Z: Schema: viewer = viewer + editor
        Z->>Store: Lookup document:readme#editor@user:bob
        Store-->>Z: Found
        Z-->>App: allowed = true (via rewrite)
    else Userset via group membership
        App->>Z: Check(document:readme, viewer, user:carol)
        Z->>Store: document:readme#viewer@group:eng#member ?
        Store-->>Z: Found - viewer is the eng group
        Z->>Store: group:eng#member@user:carol ?
        Store-->>Z: Found
        Z-->>App: allowed = true (group member)
    else Parent-folder inheritance (tuple-to-userset)
        App->>Z: Check(document:spec, viewer, user:anna)
        Z->>Z: Schema: viewer = viewer + parent->viewer
        Z->>Store: document:spec#parent@folder:eng ?
        Store-->>Z: parent = folder:eng
        Z->>Store: folder:eng#viewer@user:anna ?
        Store-->>Z: Found
        Z-->>App: allowed = true (inherited from folder)
    else Expand for a share dialog
        App->>Z: Expand(document:readme, viewer)
        Z-->>App: userset tree { user:anna, editor:{user:bob}, group:eng#member }
    else Consistency after revoke (zookie)
        App->>Z: Write: delete document:readme#viewer@user:anna
        Z-->>App: zookie Zk1 (snapshot after revoke)
        App->>Z: Check(document:readme, viewer, user:anna) at_least_as_fresh Zk1
        Z->>Store: Evaluate at snapshot >= Zk1
        Store-->>Z: No tuple - revoke is visible
        Z-->>App: allowed = false (no stale read)
    end

    note over Z,Store: Zookie prevents the "new enemy" problem -<br/>a revoked user cannot slip through a stale replica.
```

Notes

- **Check** returns a boolean; **Expand** returns the whole userset tree (for share UIs and audit).
- Rewrites (`viewer = viewer + editor`), group usersets, and `parent->viewer` all compose in the
  schema — the evaluation walks the tuple graph until it finds the user or exhausts the paths.
- Passing the **zookie** from a write into a later Check requests an at-least-as-fresh snapshot,
  trading a little latency for correctness after security-relevant changes.
