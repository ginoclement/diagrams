# Attribute-Based Access Control (ABAC)

**Status:** ✅ Current

## What it is

ABAC decides access by evaluating **attributes** against **policies**, rather than by static role
grants. A decision is a function of four attribute categories (NIST SP 800-162):

- **Subject** attributes — who is asking: department, clearance, employment type, group.
- **Resource** attributes — what is being acted on: classification, owner, tenant, data region.
- **Action** attributes — the operation: read, write, approve, delete.
- **Environment** attributes — the context: time of day, source IP, device posture, risk score.

A policy is a boolean rule over these attributes, e.g. *"Permit read if
`subject.clearance >= resource.classification` AND `subject.region == resource.region` AND
`env.deviceManaged == true`"*. Because conditions compare **values** at request time, ABAC
expresses rules that would require an explosion of roles under [RBAC](../rbac/README.md).

## When it is used

- Context-dependent or data-dependent access: multi-tenant isolation, data-residency rules,
  clearance/classification models, time- or location-bounded access, device-posture gating.
- When [RBAC](../rbac/README.md) suffers **role explosion** — the moment roles start encoding
  region, tier, tenant, or ownership, those distinctions belong in attributes.
- Often implemented on top of a policy engine ([OPA/Cedar](../pbac-policy-engine/README.md)) or the
  [XACML](../xacml-pdp-pep/README.md) architecture; ABAC is the *model*, those are *mechanisms*.

## Actors and components

| Component | Role |
|---|---|
| Subject | The user or workload requesting an action, carrying subject attributes |
| PEP | Policy Enforcement Point: intercepts the request, builds the decision request |
| PDP | Policy Decision Point: evaluates policies against attributes, returns Permit/Deny |
| PIP | Policy Information Point: supplies missing attributes (HR system, device service, risk API) |
| PAP | Policy Administration Point: where policies are authored and published |
| Resource | The protected object carrying resource attributes |

## Alternate scenarios covered

- **Missing attribute resolved via PIP** — the PDP fetches an attribute it was not handed.
- **Environment condition fails** — same subject/resource, but off-hours or unmanaged device → Deny.
- **Indeterminate / attribute unavailable** — PIP is down and the attribute cannot be resolved; the
  policy's combining algorithm decides the safe default (deny-biased).
- **Deny-overrides combining** — one matching Deny rule beats any number of Permits.

## Security notes

- **Attribute integrity is everything**: ABAC is only as trustworthy as its attribute sources. A
  spoofable `department` header is a bypass; source attributes from signed tokens or authoritative
  PIPs, never from client-controlled input.
- Choose an explicit **combining algorithm** (deny-overrides, permit-overrides, first-applicable)
  and a safe default; an unmatched request should **Deny by default**, not fall through to Permit.
- Handle **Indeterminate** (attribute missing/PIP error) deliberately — treat it as Deny for
  sensitive resources rather than skipping the condition.
- ABAC policies can become hard to reason about; keep them testable and version them in the
  [PAP](../xacml-pdp-pep/README.md). Log the **attributes and rule** that produced each decision.
- Beware attribute **staleness**: cache TTLs on PIP data create windows where a revoked clearance
  still permits access; align caching with your revocation SLA.

## Related diagrams

- [RBAC](../rbac/README.md) — the coarser model ABAC replaces when context/data matters.
- [ReBAC / Zanzibar](../rebac-zanzibar/README.md) — relationships instead of standalone attributes.
- [XACML PDP/PEP](../xacml-pdp-pep/README.md) — the canonical architecture that formalized ABAC.
- [Policy engine (OPA/Cedar)](../pbac-policy-engine/README.md) — a modern way to run ABAC policies.
- [Policy decision and enforcement](../policy-decision-enforcement/README.md) — the generic
  PEP/PDP/PIP/PAP pattern at a gateway.

## Files

- [sequence.md](sequence.md) — decision request, PIP attribute fetch, and Deny/Indeterminate alternates.
- [swimlane.md](swimlane.md) — lanes for Subject, PEP, PDP, PIP, PAP, Resource.
- [flowchart.md](flowchart.md) — attribute-gathering and policy-evaluation decision logic.
