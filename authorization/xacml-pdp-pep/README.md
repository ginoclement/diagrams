---
title: "XACML — PDP / PEP Reference Architecture"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# XACML — PDP / PEP Reference Architecture

**Status:** 🟡 Legacy

## What it is

**XACML** (eXtensible Access Control Markup Language, OASIS) is the standard that formalized
[ABAC](../abac/README.md) and the **PEP/PDP** split. It defines both a **policy language** (Policy,
PolicySet, Rule, Target, Condition) and a **request/response protocol** (a decision request over
subject/resource/action/environment attributes; a response of Permit, Deny, NotApplicable, or
Indeterminate, optionally carrying obligations and advice). Its named components:

- **PEP** — Policy Enforcement Point: intercepts the access, forms the XACML request, enforces the
  result (and executes obligations).
- **PDP** — Policy Decision Point: evaluates applicable policies and returns the decision.
- **PIP** — Policy Information Point: supplies attribute values the request did not carry.
- **PAP** — Policy Administration Point: authors and publishes policies to the PDP.
- **Context Handler** — translates between the native request and the canonical XACML request
  context, and orchestrates PIP attribute retrieval.
- **Obligations / Advice** — actions returned with a decision. **Obligations MUST be fulfilled** by
  the PEP or the decision fails (e.g. "log this access", "send notification"); **Advice MAY be
  ignored**.

## When it is used

- Established enterprise and government deployments (finance, defense, healthcare) with heavyweight,
  centralized, standards-based authorization — often via vendor products (Axiomatics, older
  ForgeRock/OpenAM, PingDataGovernance).
- **New builds rarely choose XACML**: its XML verbosity and complexity pushed the industry toward
  [OPA/Rego and AWS Cedar](../pbac-policy-engine/README.md), which offer the same PEP/PDP/PIP/PAP
  architecture with developer-friendly languages and GitOps distribution. Treat XACML as the
  conceptual ancestor you will still meet in existing systems.

## Actors and components

| Component | Role |
|---|---|
| PEP | Enforcement point; builds the request, enforces Permit/Deny, fulfills obligations |
| Context Handler | Canonicalizes the request; coordinates PIP attribute lookups |
| PDP | Evaluates PolicySet/Policy/Rule, applies combining algorithms, returns the decision |
| PIP | Resolves subject/resource/environment attributes on demand |
| PAP | Authors and publishes policies consumed by the PDP |
| Obligations service | Carries out obligations the PEP must fulfill (logging, notification) |

## Alternate scenarios covered

- **NotApplicable** — no policy targets the request; the PEP applies its default (deny).
- **Indeterminate** — evaluation error or unresolved attribute; combining algorithm decides.
- **Obligation on Permit** — access allowed *only if* the PEP can fulfill the obligation.
- **Rule-combining algorithm** — deny-overrides / permit-overrides / first-applicable resolving
  conflicts across rules and policies.

## Security notes

- **Obligations are mandatory**: a Permit with an obligation the PEP cannot fulfill must be treated
  as a failure (deny/abort), not a plain allow. Confusing obligations with advice is a real bypass.
- **Default on NotApplicable/Indeterminate must be deny** at the PEP; never let an unmatched or
  errored request fall through to allow.
- **Attribute trust**: the PDP's decision is only as good as PIP data and the request the PEP built;
  source attributes from authoritative, integrity-protected systems.
- **Combining-algorithm choice** materially changes outcomes; pick and document deny-overrides
  unless there is a specific reason otherwise, and beware Indeterminate-handling variants
  (`deny-unless-permit`, etc.).
- XACML's complexity is itself a risk — large PolicySets are hard to audit; if you are starting
  fresh, prefer an analyzable engine like [Cedar](../pbac-policy-engine/README.md).

## Related diagrams

- [Policy engine (OPA / Cedar)](../pbac-policy-engine/README.md) — the modern replacement; **use
  instead** for greenfield.
- [ABAC](../abac/README.md) — the model XACML standardized.
- [Policy decision and enforcement](../policy-decision-enforcement/README.md) — the generic
  PEP/PDP/PIP/PAP pattern XACML named.

## Files

- [sequence.md](./sequence.md) — request/response exchange with PIP lookup, obligations, and NotApplicable/Indeterminate.
- [swimlane.md](./swimlane.md) — lanes for PEP, Context Handler, PDP, PIP, PAP.
- [flowchart.md](./flowchart.md) — decision resolution with combining algorithm and obligation enforcement.
