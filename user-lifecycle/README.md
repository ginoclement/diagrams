# User Lifecycle & Identity Governance (Joiner-Mover-Leaver)

Identity governance is the discipline of ensuring the **right people have the right access
to the right resources at the right time** — and, just as importantly, that access is
removed the moment it is no longer warranted. The dominant model for describing this is
**Joiner-Mover-Leaver (JML)**: an employee (or contractor) *joins* the organization,
*moves* between roles over time, and eventually *leaves*. Each transition is an event that
must ripple out from an authoritative **source of truth** (usually an HR / HCM system),
through an **IGA (Identity Governance and Administration) engine** that decides what
access is appropriate, into an **IdP** and every **downstream application**.

These diagrams model the machinery behind that ripple: birthright and role-based access
(RBAC) provisioning, SCIM CRUD to downstream apps, separation-of-duties (SoD) checks,
periodic access recertification, and full deprovisioning with data retention. Concepts are
kept technically accurate to real IGA products (Okta Lifecycle Management, SailPoint,
Saviynt, Microsoft Entra ID Governance) and the SCIM 2.0 protocol.

## Diagrams

| Diagram | Description |
|---|---|
| [joiner-onboarding](joiner-onboarding/README.md) | New-hire onboarding: HR event to IGA to IdP account creation, birthright/RBAC access, downstream provisioning, and credential issuance. |
| [mover-role-change](mover-role-change/README.md) | Role/department/manager change: access re-evaluation that both grants new entitlements and revokes stale ones, gated by SoD checks and owner approval. |
| [leaver-offboarding](leaver-offboarding/README.md) | Termination: disable the IdP account, kill sessions/tokens, deprovision apps, reclaim licenses/devices, archive or transfer data, and delete after retention. |
| [scim-provisioning](scim-provisioning/README.md) | The SCIM 2.0 wire protocol underneath provisioning: POST/PUT/PATCH/DELETE on `/Users` and `/Groups`, conflicts, soft-delete, and rate limiting. |
| [access-review-certification](access-review-certification/README.md) | Periodic access recertification campaigns: reviewers certify or revoke access, no-response auto-revokes, and revocations feed remediation. |
| [jml-orchestration](jml-orchestration/README.md) | The high-level overview that ties joiner, mover, and leaver together through the HR source of truth, IGA engine, IdP, and downstream apps. |

## Reading order

Start with [jml-orchestration](jml-orchestration/README.md) for the big picture, then dive
into [joiner-onboarding](joiner-onboarding/README.md), [mover-role-change](mover-role-change/README.md),
and [leaver-offboarding](leaver-offboarding/README.md) for each transition.
[scim-provisioning](scim-provisioning/README.md) shows the protocol those three rely on to
push changes into apps, and [access-review-certification](access-review-certification/README.md)
is the ongoing control that catches access the JML events missed.

## Related categories

- [oidc/](../oidc/) — the runtime login flows that consume the accounts these processes create.
- [saml/](../saml/) — enterprise assertion-based federation into the same downstream apps.
- [tokenless/](../tokenless/) — the sessions and cookies a leaver's offboarding must destroy.
