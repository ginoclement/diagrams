# SCIM 2.0 Provisioning — Sequence Diagram

Happy path first (create, patch, deactivate lifecycle), then 409-conflict reconciliation,
group-membership patch, soft-delete, and 429 rate-limit alternates.

```mermaid
sequenceDiagram
    autonumber
    participant IdP as IdP / IGA (SCIM Client)
    participant SP as App (SCIM Service Provider)
    participant Store as Identity Store

    %% --- Happy path: create ---
    IdP->>SP: POST /Users<br/>{userName, name, emails, active:true}
    SP->>SP: Validate schema + required attributes
    SP->>Store: Insert user record
    Store-->>SP: id = 2819c223
    SP-->>IdP: 201 Created<br/>Location /Users/2819c223 + resource

    %% --- Happy path: partial update ---
    IdP->>SP: PATCH /Users/2819c223<br/>op=replace path=title value="Staff Engineer"
    SP->>Store: Apply changed attribute only
    Store-->>SP: OK
    SP-->>IdP: 200 OK (updated resource)

    %% --- Happy path: deactivate ---
    IdP->>SP: PATCH /Users/2819c223<br/>op=replace path=active value=false
    SP->>Store: Set active=false
    SP-->>IdP: 200 OK

    %% --- Alternates ---
    alt 409 Conflict on create
        IdP->>SP: POST /Users {userName:"jdoe"}
        SP->>Store: Uniqueness check on userName
        Store-->>SP: Already exists (id 91b8f)
        SP-->>IdP: 409 Conflict<br/>scimType=uniqueness
        IdP->>SP: GET /Users?filter=userName eq "jdoe"
        SP-->>IdP: 200 OK - existing id 91b8f
        IdP->>SP: PATCH /Users/91b8f (reconcile attributes)
        SP-->>IdP: 200 OK
    else PATCH group membership
        IdP->>SP: PATCH /Groups/engineers<br/>op=add path=members value=[{value:2819c223}]
        SP->>Store: Append member, leave others intact
        SP-->>IdP: 200 OK (or 204 No Content)
        Note over IdP,SP: Targeted add avoids rewriting the<br/>whole members array (safe for large groups)
    else Soft-delete via active=false
        IdP->>SP: PATCH /Users/2819c223 op=replace active=false
        SP->>Store: Deactivate but retain record
        SP-->>IdP: 200 OK
        Note over IdP,Store: Preferred over DELETE when the leaver<br/>record must survive a retention window
    else Hard delete
        IdP->>SP: DELETE /Users/2819c223
        SP->>Store: Remove record
        SP-->>IdP: 204 No Content
    end

    opt 429 rate limiting
        IdP->>SP: POST /Users (burst provisioning)
        SP-->>IdP: 429 Too Many Requests<br/>Retry-After 30
        IdP->>IdP: Back off for Retry-After, then retry
        IdP->>SP: POST /Users (retry)
        SP-->>IdP: 201 Created
    end
```

Notes

- SCIM `PATCH` sends only the delta, which is why mover group changes use it instead of a
  full `PUT` that would clobber unrelated attributes.
- A `409` with `scimType=uniqueness` is the normal signal to switch from create to update —
  a robust client never treats it as a hard failure.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
