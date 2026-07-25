---
title: "Resource-Based Constrained Delegation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Resource-Based Constrained Delegation — Swimlane Diagram

The `Backend` lane now owns the authorization data. Note that the `Directory`
lookup happens inside the KDC lane against the back-end account object, before any
ticket is issued.

```mermaid
flowchart TD
    subgraph User
        U1["Sign in with forms login, SAML or certificate"]
        U2(["Sees back-end data under the user's own rights"])
    end

    subgraph Client
        C1["Send credentials or assertion to the front end"]
        C2["Receive the application response"]
    end

    subgraph Frontend
        F1["Authenticate the user by non-Kerberos means,<br/>map to user@REALM"]
        F2["S4U2Self TGS-REQ with PA-FOR-USER"]
        F3["Hold the evidence ticket, forwardable or not"]
        F4["S4U2Proxy TGS-REQ for the back-end SPN"]
        F5["AP-REQ to the back end as the user"]
        F6(["Delegation denied - KDC_ERR_BADOPTION"])
    end

    subgraph KDC
        K1["Verify PA-FOR-USER checksum, build the user's PAC"]
        K2{"User sensitive or<br/>in Protected Users?"}
        K3["Issue evidence ticket to the front end<br/>in the user's name"]
        K4["Read msDS-AllowedToActOnBehalfOfOtherIdentity<br/>from the back-end account object"]
        K5{"Front-end SID granted<br/>in the resource DACL?"}
        K6{"Front end has an SPN?"}
        K7["Issue forwardable ticket for the back-end SPN,<br/>cname=user, PAC copied, S4U_DELEGATION_INFO added"]
        K8(["Refuse - delegation not authorized"])
    end

    subgraph Backend
        D1["Account object stores the security descriptor<br/>listing principals allowed to delegate to it"]
        B1["Decrypt ticket with own account key"]
        B2["Validate authenticator and replay cache"]
        B3["Authorize from the user's PAC"]
        B4["Return data"]
    end

    U1 --> C1 --> F1 --> F2 --> K1 --> K2
    K2 -->|Yes| K8 --> F6
    K2 -->|No| K3 --> F3 --> F4 --> K4
    D1 --> K4
    K4 --> K5
    K5 -->|No| K8
    K5 -->|Yes| K6
    K6 -->|No| K8
    K6 -->|Yes| K7 --> F5 --> B1 --> B2 --> B3 --> B4 --> C2 --> U2
```

Notes

- `D1 --> K4` is the whole point of RBCD: the authorization data lives in the
  resource's lane, so the resource owner controls who may impersonate users to it.
- There is no forwardable-flag gate between `F3` and `K4`. Unlike
  [constrained delegation](../constrained-delegation/README.md), RBCD accepts a
  non-forwardable evidence ticket and still returns a forwardable one.
- Anyone who can write `D1` effectively controls the `Backend` lane; see the
  abuse path in [flowchart.md](flowchart.md) and the security notes in
  [README.md](README.md).
