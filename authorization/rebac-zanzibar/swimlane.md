# ReBAC / Zanzibar — Swimlane Diagram

One lane per component. The app calls Check; the Zanzibar service walks tuples and schema rewrites
to answer.

```mermaid
flowchart TD
    subgraph App["App (PEP)"]
        A1["Receive user action<br/>on an object"]
        A2["Call Check(object, relation, user)<br/>(optionally with a zookie)"]
        A3{"allowed?"}
        A4["Render / execute"]
        A5["403 Forbidden"]
    end

    subgraph Z["Zanzibar (PDP)"]
        Z1["Load namespace schema<br/>for object type"]
        Z2["Direct tuple<br/>object#relation@user ?"]
        Z3["Apply userset rewrites<br/>(editor->viewer, unions)"]
        Z4["Walk group usersets<br/>and parent->relation"]
        Z5["Resolve at snapshot<br/>>= zookie if supplied"]
        Z6["Return allowed true/false"]
    end

    subgraph Store["Tuple Store"]
        S1["Versioned relation tuples"]
    end

    subgraph Schema["Namespace Schema"]
        C1["Relations + rewrite rules<br/>per object type"]
    end

    C1 -.->|"schema"| Z1
    A1 --> A2 --> Z1 --> Z2 --> S1
    Z2 --> Z3 --> Z4 --> Z5 --> S1
    Z5 --> Z6 --> A3
    A3 -->|Yes| A4
    A3 -->|No| A5
```

Notes

- The schema lane feeds rewrite rules into evaluation (dashed) — it defines how `viewer`, `editor`,
  group membership, and `parent` relations compose.
- `Z2 → Z3 → Z4` is the graph walk: try the direct tuple, then computed usersets, then group and
  parent inheritance, short-circuiting as soon as a path proves the relation.
- `Z5` enforces consistency: with a **zookie** the store answers from a snapshot no older than the
  referenced write, closing the stale-read window after a revoke.
