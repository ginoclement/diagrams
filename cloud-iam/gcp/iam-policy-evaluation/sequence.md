---
title: "IAM Allow-Policy Evaluation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IAM Allow-Policy Evaluation — Sequence Diagram

Happy path first (permission inherited and allowed), then alternates: deny policy override,
a false IAM Condition, and grant present only at an ancestor.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client (SDK / gcloud)
    participant API as Google API
    participant IAM as Cloud IAM
    participant Hier as Resource Hierarchy

    Client->>API: Request with Bearer access token<br/>action storage.objects.get on bucket
    API->>API: Authenticate token, resolve principal + required permission
    API->>IAM: checkAccess(principal, permission, resource)
    IAM->>Hier: Fetch deny policies (org, folder, project, resource)
    Hier-->>IAM: Deny rules (may be empty)
    IAM->>IAM: Evaluate deny rules first
    IAM->>Hier: Fetch allow policies up the ancestry chain
    Hier-->>IAM: Bindings from resource + project + folder(s) + org
    IAM->>IAM: Union bindings, expand group membership,<br/>evaluate any CEL conditions

    alt Allowed - matching binding, no deny
        IAM-->>API: ALLOW
        API-->>Client: 200 Object bytes
    else Denied by deny policy
        IAM->>IAM: Deny rule matches principal + permission,<br/>condition true, principal not in exceptions
        IAM-->>API: DENY (explicit deny)
        API-->>Client: 403 PERMISSION_DENIED
    else Binding condition evaluates false
        IAM->>IAM: Only matching binding has condition<br/>request.time / resource.name false
        IAM-->>API: DENY (no applicable grant)
        API-->>Client: 403 PERMISSION_DENIED
    else Grant only at an ancestor
        IAM->>IAM: No binding on the resource, but<br/>folder-level roles/storage.objectViewer applies
        IAM-->>API: ALLOW (inherited)
        API-->>Client: 200 Object bytes
    end
```

Notes

- Deny evaluation always precedes allow evaluation; a single matching deny rule short-circuits
  to DENY unless the principal is listed in that rule's `exceptionPrincipals`.
- Allow decisions are a union across the whole ancestry chain — there is no "closest policy
  wins"; any matching binding at any level grants access.
- Group membership is expanded transitively, so a principal can match a binding via a nested
  Google group.
