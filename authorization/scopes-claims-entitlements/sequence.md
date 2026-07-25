---
title: "Scopes, Claims, Entitlements — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Scopes, Claims, Entitlements — Sequence Diagram

Happy path first: the client obtains a token stamped with scopes and claims (coarse, token-time),
then a request passes the gateway scope check and the resource's fine-grained entitlement check.
Alternates: missing scope, scope present but entitlement denied, a stale role claim re-checked
against live data, and a step-up requirement.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client
    participant IdP as IdP (AuthZ Server)
    participant GW as API Gateway (PEP)
    participant API as Resource
    participant Data as Policy / Data

    Note over User,IdP: Token time - coarse authorization
    User->>IdP: Authenticate + consent to scopes
    IdP->>IdP: Mint access token: scope=invoices.read invoices.write,<br/>claims roles, tenant, acr
    IdP-->>Client: Access token (+ ID token for identity)

    Note over Client,API: Runtime - fine-grained authorization
    Client->>GW: POST /invoices/42/approve (Bearer access token)
    GW->>GW: Validate token (iss, aud, sig, exp)
    GW->>GW: Route needs scope invoices.write - present?
    GW->>API: Forward request + subject claims
    API->>Data: Entitled? subject may approve invoice 42
    Data-->>API: Yes - subject is approver on invoice 42
    API-->>GW: 200 Approved
    GW-->>Client: 200 OK

    alt Missing required scope
        Client->>GW: Request needing invoices.write
        GW->>GW: Token scope = invoices.read only
        GW-->>Client: 403 insufficient_scope
    else Scope OK but entitlement denied
        Client->>GW: POST /invoices/99/approve
        GW->>API: Scope invoices.write present, forward
        API->>Data: Entitled on invoice 99?
        Data-->>API: No - not owner/approver of this object
        API-->>Client: 403 Forbidden (object-level deny)
    else Stale role claim re-checked live
        Client->>GW: Request relying on roles claim Approver
        GW->>API: Forward with roles=[Approver] claim
        API->>Data: Confirm role still current (revocation check)
        Data-->>API: Role revoked since issuance
        API-->>Client: 403 Forbidden (claim stale)
    else Step-up required
        Client->>GW: High-risk action, token acr=low
        GW-->>Client: 401 step_up (need stronger acr/amr)
    end

    note over GW,API: Scope is a ceiling on the client, NOT permission on this object.<br/>The resource always re-decides the instance-level entitlement.
```

Notes

- **Token time vs runtime**: scopes and claims are fixed when the token is minted; the entitlement
  is resolved per request against live policy/data, so it reflects the current state, not issuance.
- **Two gates, two failure modes**: the gateway returns `insufficient_scope` (coarse) while the
  resource returns an object-level `403` (fine-grained). Passing the first never implies the second.
- **Claim freshness**: role/group/entitlement claims are point-in-time; sensitive actions re-verify
  against authoritative data rather than trusting the token's snapshot.
