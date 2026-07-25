---
title: "Policy Decision and Enforcement (PEP / PDP / PIP / PAP)"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Policy Decision and Enforcement (PEP / PDP / PIP / PAP)

**Status:** ✅ Current

## What it is

The generic **externalized-authorization** reference architecture, originally named by XACML and now
the shared vocabulary for OPA, Cedar, AVP, and API-gateway/sidecar authorization. It splits
authorization into four cooperating roles so that *deciding* access is separated from *enforcing* it:

- **PEP — Policy Enforcement Point.** Sits in the request path (an **API gateway** or a **sidecar**
  next to the service). It intercepts the request, builds a **decision request** (subject, action,
  resource, context), calls the PDP, and **enforces** the result — allow, deny, or apply obligations.
  The PEP never contains policy logic.
- **PDP — Policy Decision Point.** Evaluates policy against the decision request and returns a
  decision, optionally with **obligations** (things the PEP must do, e.g. redact a field, log, set a
  header) and **advice** (optional hints). The PDP holds no request state.
- **PIP — Policy Information Point.** Supplies **attributes the request lacks** — user department,
  resource owner, risk score, group membership — fetched from directories, databases, or risk
  services when the policy references an attribute not already in the decision request.
- **PAP — Policy Administration Point.** Where policy is **authored, versioned, and distributed** to
  PDPs (a bundle server, a policy store, GitOps). Not in the request path.

The key property is **separation of decision from enforcement**: policy changes at the PAP propagate
to PDPs without redeploying the PEP-fronted services, and enforcement stays uniform across many
services because they all delegate the decision.

## When it is used

- API gateways and service meshes that must apply consistent authorization across many backends.
- **Sidecar** deployments (PDP co-located with each service) for low-latency, localhost decisions.
- Any system that wants **policy as code** decoupled from application code — auditable, testable,
  changeable independently of releases.

## Actors and components

| Component | Role |
|---|---|
| Client | Sends the API request carrying an identity token/credential |
| PEP (Gateway / Sidecar) | Intercepts, builds the decision request, enforces the decision + obligations |
| PDP (Policy Engine) | Evaluates policy against the request, returns decision + obligations |
| PIP (Attribute source) | Provides missing attributes (directory, DB, risk/context service) |
| PAP (Policy control plane) | Authors, versions, and distributes policy to the PDP |
| Resource / Service | Executes the action once the PEP allows it |

## Alternate scenarios covered

- **Deny decision** — the PDP returns `Deny`; the PEP blocks the request and returns 403.
- **Permit with obligations** — allow, but the PEP must fulfil an obligation (mask a field, emit an
  audit event, set a header) before releasing the response; a failed obligation flips to deny.
- **Attribute fetch from PIP** — policy references an attribute absent from the request, so the PDP
  (or PEP) resolves it from a PIP before deciding.
- **PIP unavailable** — a required attribute cannot be resolved → the decision is `Indeterminate`,
  which the PEP treats as **deny** (fail-closed).
- **PDP unreachable** — the PEP fails closed and denies rather than allowing.
- **Policy update from PAP** — a new policy version is distributed to the PDP out of band.

## Security notes

- **Fail closed everywhere.** A missing decision, an `Indeterminate` result, an unresolved required
  attribute, or an unreachable PDP must all resolve to **deny**. Default-allow anywhere in the chain
  is a critical flaw.
- **Enforce obligations or deny.** An obligation the PEP cannot satisfy (e.g. it cannot redact the
  field) means the permit is void — the PEP must not release the response. Obligations are part of
  the decision, not optional advice.
- **Trust the decision request's provenance.** The PDP decides on whatever the PEP sends; populate
  subject attributes from validated tokens and authoritative PIPs, never from client-supplied fields,
  or the decision is spoofable.
- **Protect the PAP → PDP channel.** Sign policy bundles and verify them at the PDP so a compromised
  control plane cannot ship an allow-everything policy; version and review policy in CI.
- **Decision logging is telemetry and evidence.** Log request + decision + policy version for every
  call; it is the audit trail and the answer to "why was this denied?". It is also sensitive data —
  protect and retain deliberately.
- **Attribute freshness.** PIP data is often cached; a revoked attribute is not effective until the
  cache refreshes — align cache TTLs with your revocation SLA.

## Related diagrams

- [ABAC](../abac/README.md) — the attribute-driven model whose evaluation this PEP/PDP split runs;
  the PIP supplies the attributes ABAC policy references.
- [PBAC Policy Engine (OPA / Cedar)](../pbac-policy-engine/README.md) — a concrete instantiation of
  this pattern with a specific engine, bundle distribution, and decision log.

## Files

- [sequence.md](sequence.md) — decision request, PIP attribute fetch, decision + obligations, and deny/fail-closed alternates.
- [swimlane.md](swimlane.md) — lanes for Client, PEP, PDP, PIP, PAP, Resource.
- [flowchart.md](flowchart.md) — evaluation logic with Indeterminate/deny and obligation-failure terminals.
