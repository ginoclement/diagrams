---
title: "Policy-Based Access Control with an External Policy Engine (OPA / Cedar)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Policy-Based Access Control with an External Policy Engine (OPA / Cedar)

**Status:** 🔵 Emerging

## What it is

PBAC **externalizes** the authorization decision into a dedicated **policy engine** that the
application calls instead of hard-coding `if` checks. The engine evaluates declarative policy
against an input document (subject, action, resource, context) and returns a decision. Two dominant
implementations:

- **Open Policy Agent (OPA)** — a general-purpose engine; policies are written in **Rego**. OPA
  runs as a sidecar or library; the app POSTs `input` to `/v1/data/...` and gets a JSON result.
  Policy and data (**bundles**) are pulled from a bundle server; decisions are shipped to a
  **decision log** sink.
- **AWS Cedar** — a purpose-built authorization language and engine (behind Amazon Verified
  Permissions). Policies are `permit`/`forbid` statements over `principal`, `action`, `resource`,
  and `context`; Cedar is analyzable (validation, formal reasoning) and **forbid-overrides** by design.

Both realize the [PEP/PDP](../policy-decision-enforcement/README.md) split: the app is the **PEP**,
the engine is the **PDP**, bundles/entity data are the **PIP** input, and the policy repo/control
plane is the **PAP**. PBAC can express [RBAC](../rbac/README.md), [ABAC](../abac/README.md), and
relationship rules — it is a *mechanism*, not a distinct model.

## When it is used

- Microservices that need consistent authorization **decoupled from application code** — change
  policy without redeploying services.
- Platform/infra authorization: Kubernetes admission control (OPA Gatekeeper), API gateways,
  Terraform/CI guardrails, service-mesh authz.
- A modern, lightweight replacement for [XACML](../xacml-pdp-pep/README.md): same architecture,
  developer-friendly languages, GitOps policy distribution.

## Actors and components

| Component | Role |
|---|---|
| App / Gateway (PEP) | Builds the `input`/authorization request, enforces the returned decision |
| Policy engine (PDP) | OPA (Rego) or Cedar; evaluates policy against input + data |
| Bundle / entity data | Policy modules and reference data (roles, groups, entities) pulled by the engine |
| Bundle server / control plane (PAP) | Publishes signed policy bundles; where policy is authored and versioned |
| Decision log sink | Receives per-decision records for audit and debugging |

## Alternate scenarios covered

- **Deny by default** — no `allow` rule (OPA) or no `permit` / a matching `forbid` (Cedar) → deny.
- **forbid/deny overrides** — an explicit deny beats any allow (Cedar `forbid`; Rego by convention).
- **Bundle update** — policy changes are pulled as a new bundle; the engine hot-swaps without redeploy.
- **Stale/failed bundle pull** — the engine keeps the last-good bundle; a signature-invalid bundle is rejected.
- **Partial data / missing entity** — the decision degrades to deny (fail-closed) rather than error-open.

## Security notes

- **Fail closed**: if the engine is unreachable or errors, the PEP must **deny**, never allow. A
  sidecar deployment keeps the PDP local to reduce this failure mode, but the PEP still needs a
  default-deny path.
- **Sign and verify bundles**: OPA bundle signing (and Cedar policy-store integrity) stops a
  compromised bundle server from shipping a policy that grants everything. Verify signatures before
  activation; pin the trusted key.
- **Decision logs are security telemetry**: log input + decision + policy version for every call.
  They are also sensitive (they contain subject/resource data) — protect and retain per policy.
- Keep **policy as code**: version, review, and test policies in CI (OPA `opa test`, Cedar
  validation). Cedar's schema-based validation and analyzability catch over-broad `permit`s statically.
- Beware **input spoofing**: the engine trusts the `input` the PEP builds. Populate subject
  attributes from validated tokens and authoritative data, not client-supplied fields.
- Mind **data freshness**: bundle/entity data is cached; a revoked role in the source system is not
  effective until the next bundle pull — align pull cadence with your revocation SLA.

## Related diagrams

- [Policy decision and enforcement](../policy-decision-enforcement/README.md) — the generic PEP/PDP
  pattern this instantiates at a gateway/sidecar.
- [XACML PDP/PEP](../xacml-pdp-pep/README.md) — the heavyweight predecessor; OPA/Cedar are the
  modern alternatives.
- [ABAC](../abac/README.md) and [RBAC](../rbac/README.md) — models these engines commonly implement.
- [ReBAC / Zanzibar](../rebac-zanzibar/README.md) — Cedar can express relationship policies; a
  related fine-grained approach.

## Files

- [sequence.md](sequence.md) — decision call, bundle pull, decision log, and deny/failure alternates.
- [swimlane.md](swimlane.md) — lanes for App/PEP, engine/PDP, bundle server/PAP, decision log.
- [flowchart.md](flowchart.md) — evaluation logic with default-deny and forbid-overrides terminals.
