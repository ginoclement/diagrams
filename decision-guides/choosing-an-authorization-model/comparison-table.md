---
title: "Authorization Models — Comparison"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Authorization Models — Comparison

| Option | Status | When to use | When NOT to use | Key tradeoffs | Security notes |
|---|---|---|---|---|---|
| **RBAC** | ✅ Current | Stable job functions, coarse-to-medium granularity, easy audit | Per-object sharing or data-dependent rules | Simple and auditable, but roles multiply ("role explosion") as exceptions grow | Review role membership regularly; avoid standing high-privilege roles, prefer JIT elevation |
| **ABAC** | ✅ Current | Access depends on attribute values: clearance, department, time, location, resource tags | When attributes are unreliable or hard to source at decision time | Very expressive, but policies get hard to reason about and test; attribute freshness matters | Trust attributes only from authoritative sources; a stale/spoofed attribute is an authorization bypass |
| **ReBAC** | ✅ Current | Per-object relationships at massive scale: docs, folders, orgs (Zanzibar shape) | Small apps where a relationship graph is overkill | Scales to billions of tuples with consistency (zookies), but is new infrastructure to run | Watch consistency vs latency (zookie snapshots); a wrong tuple leaks or blocks access silently |
| **PBAC (policy engine)** | ✅ Current | Policy must be centrally authored, versioned, tested, decoupled from app code (OPA/Rego, Cedar) | Trivial apps where an embedded check is enough | Central governance and decision logs, but adds a PDP to deploy, distribute bundles to, and keep fast | Secure the PEP→PDP path; fail closed on PDP unavailability; sign and version policy bundles |
| **XACML (PDP/PEP)** | 🟡 Legacy | Existing XACML estates; standards-mandated environments | New greenfield authorization | Rich standardized model (PEP/PDP/PIP/PAP, obligations) but verbose XML and heavy tooling | **Why legacy:** XML policies are hard to author/test; ecosystem has shifted. **Use instead:** a modern policy engine (PBAC) |

Notes

- These models **layer** rather than compete: a common pattern is a coarse **RBAC/scope** check
  at the gateway plus a fine-grained **ReBAC** or **PBAC** check inside the service.
- Choose by **what the decision is a function of**: roles (RBAC), attributes (ABAC),
  relationships (ReBAC), or externalized policy (PBAC). Many real policies mix attributes and
  relationships — a policy engine can evaluate both.
- Whichever model you pick, keep the decision point (PDP) and enforcement point (PEP) distinct
  and make enforcement **fail closed** — see [pbac-policy-engine](../../authorization/pbac-policy-engine/README.md).
