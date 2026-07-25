---
title: "Choosing an Authorization Model"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Choosing an Authorization Model

**Status:** ✅ Current

This guide picks the **fine-grained authorization model** — how a system decides "may this
subject do this action on this resource?" — by **scale**, **granularity**, and
**relationship-density** of the decision:

- Decisions are a function of a **role/job function** → **RBAC**
- Decisions depend on **attributes** of subject/resource/action/environment → **ABAC**
- Decisions depend on **relationships between objects** ("is U an editor of D", "is D in a
  folder U owns") at large scale → **ReBAC** (Zanzibar-style)
- Decisions must be **externalized, versioned policy** evaluated by a dedicated engine → **PBAC**
  (policy engine: OPA/Rego, Cedar)

These models are **not mutually exclusive** — real systems layer them (a coarse RBAC/scope
check at the gateway plus a fine-grained ReBAC or PBAC check in the service). The tree picks
the *primary* model for a given decision; the comparison table covers how they combine.

The classic **XACML** PDP/PEP architecture appears as a 🟡 legacy leaf: its concepts live on,
but new builds use a modern policy engine (PBAC).

## How to use this guide

1. Walk [flowchart.md](./flowchart.md): first "is the decision about relationships between
   objects?", then attribute vs role, then whether policy must be externalized.
2. Follow the leaf's **Leaf link** to the concrete model diagram.
3. Check [comparison-table.md](./comparison-table.md) for scale/granularity tradeoffs, when NOT
   to use each, and how to layer them.

## Options at a glance

- ✅ **RBAC** — roles bundle permissions; best for stable job functions and coarse-to-medium
  granularity. Watch for "role explosion".
- ✅ **ABAC** — attribute expressions; best when access depends on data values (clearance,
  department, time, location) rather than a fixed role.
- ✅ **ReBAC** — relationship tuples and graph checks; best for per-object sharing at massive
  scale (documents, folders, orgs), the Google Zanzibar shape.
- ✅ **PBAC** — externalized policy engine (OPA/Rego, Cedar); best when policy must be
  centrally authored, versioned, tested, and decoupled from app code.
- 🟡 **XACML** — the standardized PDP/PEP/PIP/PAP ancestor of PBAC. **Use instead:** a modern
  policy engine (PBAC) for new work.

## Related diagrams

- [RBAC](../../../authorization/rbac/README.md)
- [ABAC](../../../authorization/abac/README.md)
- [ReBAC (Zanzibar)](../../../authorization/rebac-zanzibar/README.md)
- [PBAC (policy engine)](../../../authorization/pbac-policy-engine/README.md)
- [XACML PDP/PEP](../../../authorization/xacml-pdp-pep/README.md) — legacy, kept for reference.

## Files

- [flowchart.md](./flowchart.md) — the decision tree.
- [comparison-table.md](./comparison-table.md) — model-by-model tradeoffs and layering guidance.
