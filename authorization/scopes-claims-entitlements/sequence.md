# Scopes vs Claims vs Entitlements — Sequence Diagram

Happy path first (scope + audience pass at the gateway, entitlement passes at the service), then
alternates: valid scope but missing entitlement, claim-based coarse gating, and a wrong-audience
token.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Client
    participant IdP as IdP
    participant GW as API Gateway
    participant Svc as Resource Service
    participant AuthZ as Authorization Service

    User->>App: Sign in, consent to scope invoices.read invoices.approve
    App->>IdP: Authorization Code + PKCE (scopes requested)
    IdP-->>App: access_token (scope, aud=invoices-api)<br/>+ id_token (sub, roles, department)

    App->>GW: POST /invoices/42/approve (Bearer access_token)
    GW->>GW: Validate signature, iss, exp
    GW->>GW: aud == invoices-api? scope has invoices.approve?
    GW->>Svc: Forward (subject sub, action approve, invoice 42)
    Svc->>AuthZ: Entitled? sub approve invoice 42
    AuthZ-->>Svc: Permit - sub is approver on invoice 42
    Svc-->>GW: 200 Approved
    GW-->>App: 200 OK
    App-->>User: Approved

    alt Valid scope but missing entitlement
        App->>GW: POST /invoices/99/approve (same token)
        GW->>GW: scope invoices.approve present -> pass
        GW->>Svc: Forward action approve invoice 99
        Svc->>AuthZ: Entitled? sub approve invoice 99
        AuthZ-->>Svc: Deny - not an approver on invoice 99
        Svc-->>GW: 403 Forbidden
        GW-->>User: 403 - scope allows the operation, you lack rights to this object
    else Coarse authZ from a claim (no runtime lookup)
        App->>GW: GET /admin/reports (Bearer access_token)
        GW->>GW: roles claim contains admin? yes -> allow endpoint
        GW->>Svc: Forward
        Svc-->>App: 200 report
    else Wrong audience
        App->>GW: Call with token minted for mail-api
        GW->>GW: aud == mail-api != invoices-api
        GW-->>App: 401 invalid_token (audience mismatch)
    end

    note over GW,Svc: Coarse (scope + audience) at the gateway;<br/>fine-grained (entitlement) at the service.<br/>Entitlements are NOT in the token - looked up live.
```

Notes

- The gateway performs **coarse, token-time** authorization: signature, `iss`, `exp`, `aud`, and
  required scope. It does not know about invoice 42 specifically.
- The service performs **fine-grained, runtime** authorization by asking the authorization service
  about *this subject and this object* — the deny in the second alternate happens *after* a passing
  scope check.
- Entitlements are deliberately absent from the token: keeping them at runtime avoids bloat and makes
  revocation immediate.
