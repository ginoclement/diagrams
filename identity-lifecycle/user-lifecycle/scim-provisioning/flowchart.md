---
title: "SCIM 2.0 Provisioning — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7643, RFC 7644"
---

# SCIM 2.0 Provisioning — Decision Flowchart

Service-provider-side request-handling logic, with explicit error terminals for auth
failure, uniqueness conflict, rate limiting, and not-found.

```mermaid
flowchart TD
    S([SCIM request received]) --> A{"Valid bearer token /<br/>OAuth credential?"}
    A -->|no| E1([401 Unauthorized])
    A -->|yes| B{"Within rate limit?"}
    B -->|no| E2([429 Too Many Requests<br/>+ Retry-After])
    B -->|yes| C{"HTTP method?"}

    C -->|POST /Users| D{"userName / externalId<br/>unique?"}
    D -->|no| E3([409 Conflict<br/>scimType=uniqueness])
    D -->|yes| F{"Schema + required<br/>attrs valid?"}
    F -->|no| E4([400 Bad Request<br/>scimType=invalidValue])
    F -->|yes| G["Insert record"] --> OK1([201 Created + resource])

    C -->|PATCH or PUT| H{"Resource id exists?"}
    H -->|no| E5([404 Not Found])
    H -->|yes| I{"active=false<br/>in the change?"}
    I -->|yes| J["Soft-delete: deactivate,<br/>retain record"] --> OK2([200 OK])
    I -->|no| K["Apply add/replace/remove ops"] --> OK2

    C -->|DELETE| L{"Resource id exists?"}
    L -->|no| E5
    L -->|yes| M["Remove or soft-delete<br/>per policy"] --> OK3([204 No Content])
```

Notes

- `409 uniqueness` is a routine control-flow signal to the client (switch to update), not a
  terminal failure — but on the server side it is still a distinct response.
- Whether `DELETE` hard-removes or maps to `active=false` is an SP policy choice; leaver
  flows under retention prefer the soft-delete mapping.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
