---
title: "PBAC Policy Engine (OPA / Cedar) — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# PBAC Policy Engine (OPA / Cedar) — Decision Flowchart

Evaluation logic from request to decision, including engine availability, bundle integrity,
default-deny, and forbid-overrides. Deny terminals are explicit.

```mermaid
flowchart TD
    Start(["Request intercepted by PEP"]) --> Build["Build input:<br/>principal, action, resource, context"]
    Build --> Up{"Policy engine<br/>reachable?"}
    Up -->|No| FailClosed(["Deny: fail closed<br/>(engine unavailable)"])
    Up -->|Yes| Bundle{"Active bundle<br/>present + signature valid?"}
    Bundle -->|No| NoBundle(["Deny: no trusted policy loaded"])
    Bundle -->|Yes| Match{"Any permit / allow<br/>rule matches input?"}

    Match -->|No| DefDeny(["Deny by default<br/>(no matching allow)"])
    Match -->|Yes| Forbid{"Any forbid / explicit<br/>deny rule also matches?"}
    Forbid -->|Yes| Override(["Deny: forbid-overrides"])
    Forbid -->|No| Data{"Required entity data<br/>resolvable?"}

    Data -->|No| Partial(["Deny: missing data<br/>(fail closed)"])
    Data -->|Yes| Allow(["Allow: PEP executes action"])

    Allow --> LogA["Emit decision log record"]
    DefDeny --> LogD["Emit decision log record"]
    Override --> LogD
```

Notes

- Two independent integrity gates precede evaluation: the **engine must be reachable** (else fail
  closed) and the **active bundle must be signature-valid** (else no trusted policy → deny).
- **Default deny** is structural: OPA returns undefined/false when no `allow` is defined; Cedar
  denies when no `permit` matches. Neither implies "allow" on a gap.
- **forbid-overrides** is Cedar's built-in semantics and the conventional Rego pattern — an explicit
  deny always wins, even against a matching allow.
- Both allow and deny outcomes are written to the **decision log**; a denied request is not a silent
  one.
