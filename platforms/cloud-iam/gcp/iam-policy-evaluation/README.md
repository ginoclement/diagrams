---
title: "GCP IAM Allow-Policy Evaluation"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# GCP IAM Allow-Policy Evaluation

**Status:** ✅ Current

## What it is

How Google Cloud decides whether a principal may perform an action on a resource. When a
caller hits a Google API, the request carries an identity (from an OAuth 2.0 access token)
and names a target resource plus an IAM permission (e.g. `storage.objects.get`). Cloud IAM
gathers the **allow policies** (`Policy` objects, a set of `bindings` mapping `role` →
`members`) attached at every level of the **resource hierarchy** —
organization → folder(s) → project → resource — plus any **deny policies**, and evaluates
them together to reach an allow or deny decision.

## When it is used

- On effectively every authenticated Google Cloud API call — it is the authorization layer
  behind Cloud Storage, Compute, BigQuery, Pub/Sub, and the rest.
- When an admin runs `gcloud projects get-iam-policy` / `setIamPolicy` or uses the Policy
  Troubleshooter / Policy Simulator to reason about access.

## Actors

| Actor | Role |
|---|---|
| Principal | The identity making the call (user, group, service account, federated principal) |
| Client | SDK / gcloud / workload presenting a Bearer access token to a Google API |
| API | The Google Cloud service endpoint receiving the request (`storage.googleapis.com`, ...) |
| IAM | Cloud IAM authorization engine that resolves policies and returns allow/deny |
| Hierarchy | Resource ancestry: organization, folders, project, resource, each holding a `Policy` |

## Key evaluation details

- **Inheritance is additive and union-based**: the effective allow set for a resource is the
  union of `bindings` from the resource and all ancestors. A role granted at the organization
  applies to every project, folder, and resource beneath it.
- A `binding` grants a `role` (a named bundle of permissions, e.g. `roles/storage.objectViewer`)
  to `members` (`user:`, `group:`, `serviceAccount:`, `principal:`, `principalSet:`,
  `allUsers`, `allAuthenticatedUsers`).
- **IAM Conditions**: a binding may carry a CEL `condition` (on `resource.name`,
  `request.time`, tags, etc.); the binding only applies when the condition evaluates true.
- **Deny policies** (`v3` deny rules) are evaluated **first** and override allows: if any deny
  rule matches the principal, permission, and its condition, access is denied regardless of
  grants — unless an exception principal is listed.
- Basic roles (`roles/owner`, `roles/editor`, `roles/viewer`) are coarse and discouraged in
  favor of predefined or custom roles (least privilege).

## Alternate scenarios covered

- Permission granted only at an ancestor (folder/org) and inherited down.
- IAM Condition present but false → binding skipped → deny.
- Deny policy matches → hard deny even with a matching allow.
- Principal is a member via a Google group (transitive membership).

## Security notes

- Deny beats allow: use deny policies to enforce guardrails (e.g. block `iam.serviceAccountKeys.create`
  org-wide) that no downstream allow can undo.
- Prefer predefined/custom least-privilege roles over basic roles and over broad ancestor grants;
  a wide org-level grant silently expands blast radius to every child resource.
- Conditions and tags let you scope grants; validate CEL expressions with the Policy Simulator
  before applying, since a malformed condition can widen or narrow access unexpectedly.
- `allUsers` / `allAuthenticatedUsers` make a resource public — restrict with an org policy
  (`iam.allowedPolicyMemberDomains` / domain-restricted sharing).

## Related diagrams

- [Service Account Impersonation](../service-account-impersonation/README.md) — how a principal borrows a service account's permissions
- [Workload Identity Federation](../workload-identity-federation/README.md) — how external principals map to `principalSet://` members
- [Identity-Aware Proxy](../identity-aware-proxy/README.md) — IAM checked at the proxy before a backend
- [Entra ID Conditional Access](../../entra/conditional-access-evaluation/README.md) — the Microsoft-side policy engine

## Files

- [sequence.md](./sequence.md) — request-time evaluation with deny/condition/inheritance alternates
- [swimlane.md](./swimlane.md) — lanes for Client, API, IAM, Hierarchy
- [flowchart.md](./flowchart.md) — deny-then-allow decision tree with explicit deny terminals
