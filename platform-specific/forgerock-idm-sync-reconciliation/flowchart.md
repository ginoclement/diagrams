---
title: "ForgeRock IDM — Reconciliation Situation Matrix Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# ForgeRock IDM — Reconciliation Situation Matrix Flowchart

For each correlated object, reconciliation computes a **situation** and runs the
mapping's configured **action**. This chart shows the core situations and their
default remediations, including deprovision on `UNQUALIFIED`.

```mermaid
flowchart TD
    Start(["Recon: for each object,<br/>correlate source and target"]) --> Link{"Link already<br/>exists?"}

    Link -->|yes| Both{"Both source and<br/>target still present?"}
    Both -->|yes| Sync{"Source still<br/>qualifies for target?"}
    Sync -->|yes| Confirmed(["CONFIRMED -<br/>update / no-op, stay linked"])
    Sync -->|no| Unqualified(["UNQUALIFIED -<br/>deprovision target, remove link"])
    Both -->|"target missing"| Missing(["MISSING -<br/>recreate target or unlink"])
    Both -->|"source missing"| SrcMissing(["SOURCE_MISSING -<br/>delete/disable target per policy"])

    Link -->|no| HasSrc{"Source object<br/>present?"}
    HasSrc -->|yes| Qual{"Source qualifies<br/>and correlates?"}
    Qual -->|"no match"| Absent(["ABSENT -<br/>CREATE target, establish link"])
    Qual -->|"one match"| Found(["FOUND -<br/>link existing target"])
    Qual -->|"many matches"| Ambiguous(["AMBIGUOUS -<br/>flag for manual review"])
    HasSrc -->|no| Unassigned(["UNASSIGNED -<br/>orphan target: report or delete"])
```
