---
title: "Constrained Delegation — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Constrained Delegation — Swimlane Diagram

Lanes show who holds which secret: the front end owns the `PA-FOR-USER` checksum
key and the allowlist attribute, the KDC enforces both S4U checks, the back end
just consumes an ordinary user ticket.

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
        F2["S4U2Self TGS-REQ with PA-FOR-USER,<br/>checksum keyed with own account key"]
        F3["Hold the evidence ticket to itself in the user's name"]
        F4["S4U2Proxy TGS-REQ for the target SPN,<br/>evidence ticket in additional-tickets"]
        F5["AP-REQ to the back end as the user"]
        F6(["Delegation denied - call fails or degrades"])
    end

    subgraph KDC
        K1["Verify PA-FOR-USER checksum, build the user's PAC"]
        K2{"User sensitive or<br/>in Protected Users?"}
        K3{"TRUSTED_TO_AUTHENTICATE_FOR_DELEGATION<br/>set on the front end?"}
        K4["Issue forwardable ticket to Frontend<br/>in the user's name"]
        K5["Issue non-forwardable ticket<br/>identity only, no delegation"]
        K6{"Evidence ticket<br/>forwardable?"}
        K7{"Requested SPN on<br/>msDS-AllowedToDelegateTo?"}
        K8["Issue ticket for the target SPN with cname=user,<br/>copy PAC, record S4U_DELEGATION_INFO"]
        K9(["KDC_ERR_BADOPTION"])
    end

    subgraph Backend
        B1["Decrypt ticket with own account key"]
        B2["Validate authenticator and replay cache"]
        B3["Authorize from the user's PAC"]
        B4["Return data"]
    end

    U1 --> C1 --> F1 --> F2 --> K1 --> K2
    K2 -->|Yes| K5
    K2 -->|No| K3
    K3 -->|No| K5
    K3 -->|Yes| K4 --> F3 --> F4 --> K6
    K5 --> F6
    K6 -->|No| K9 --> F6
    K6 -->|Yes| K7
    K7 -->|No| K9
    K7 -->|Yes| K8 --> F5 --> B1 --> B2 --> B3 --> B4 --> C2 --> U2
```

Notes

- In *Kerberos only* mode the `F2 --> K1` path is skipped: the client's own
  SPNEGO AP-REQ supplies a forwardable service ticket that becomes the evidence
  ticket directly at `F4`. See [SPNEGO over HTTP](../spnego-http/README.md).
- `K7` is the constraint that names this model. Compare
  [RBCD](../resource-based-constrained-delegation/README.md), where the equivalent
  check reads an attribute on the **back end** instead.
- `K5` is a useful state in its own right: S4U2Self without protocol transition is
  a legitimate way to obtain a user's PAC for authorization decisions while
  deliberately forbidding onward delegation.
