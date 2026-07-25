---
title: "Dynamic Client Registration — Swimlane"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 7591, RFC 7592"
---

# Dynamic Client Registration — Swimlane

The Client drives registration and self-management; the Directory issues software
statements for protected registration; the IdP validates and persists the record.

```mermaid
flowchart TD
    subgraph Client
        C1["Build client_metadata<br/>(redirect_uris, grant_types, ...)"]
        C2["POST /register"]
        C3["Store client_id, secret,<br/>registration_access_token"]
        C4["GET/PUT/DELETE<br/>registration_client_uri"]
    end

    subgraph Dir["Directory (SS issuer)"]
        D1["Issue signed<br/>software_statement (JWT)"]
    end

    subgraph IdP["IdP (auth server)"]
        I1{"Registration protected?<br/>need initial token / SS?"}
        I2["Verify software_statement<br/>signature and claims"]
        I3{"Metadata valid?"}
        I4["201 Created client_id<br/>+ reg access token"]
        I5["400 invalid_client_metadata"]
        I6["401 Unauthorized"]
        I7{"Reg access token valid<br/>for this client?"}
        I8["Apply read/update/delete"]
    end

    D1 -.->|software_statement| C2
    C1 --> C2 --> I1
    I1 -->|"protected"| I2 --> I3
    I1 -->|open| I3
    I3 -->|No| I5
    I3 -->|Yes| I4 --> C3
    C3 --> C4 --> I7
    I7 -->|No| I6
    I7 -->|Yes| I8
```
