# Managed Identity via IMDS — Sequence Diagram

Happy path first (system-assigned token from IMDS, call target), then user-assigned
selection, cache hit, RBAC denial, and IMDS-unreachable alternates.

```mermaid
sequenceDiagram
    autonumber
    participant App as App
    participant IMDS as IMDS
    participant Fabric as Fabric
    participant Entra as Entra
    participant Target as Target

    App->>IMDS: GET /metadata/identity/oauth2/token<br/>?resource=https://vault.azure.net<br/>(Header Metadata: true)
    IMDS->>Fabric: Request token for system-assigned identity
    Fabric->>Entra: Authenticate managed identity, request token
    Entra-->>Fabric: access_token (JWT, oid = identity)
    Fabric-->>IMDS: access_token + expires_on
    IMDS-->>App: 200 access_token
    App->>Target: Call API with Bearer access_token
    Target->>Target: Validate token, check Azure RBAC
    Target-->>App: 200 - action allowed

    alt User-assigned identity
        App->>IMDS: GET ...token?resource=...&client_id=GUID
        IMDS->>Fabric: Request token for that user-assigned identity
        Fabric-->>IMDS: access_token for selected identity
        IMDS-->>App: 200 access_token
    else Token cache hit
        App->>IMDS: GET ...token (same resource)
        IMDS-->>App: 200 cached access_token (not yet expired)
    else RBAC not granted on target
        App->>Target: Call API with valid token
        Target-->>App: 403 - no role assignment for this identity
    else IMDS unreachable / identity not configured
        App->>IMDS: GET ...token
        IMDS-->>App: 400/timeout - no managed identity available
        App->>App: Fail fast, surface configuration error
    end
```

Notes

- The token is a normal Entra access token, the difference is only how it is obtained,
  from the local IMDS endpoint with no secret in the app.
- With multiple user-assigned identities attached the caller must pass `client_id` or
  `mi_res_id`, otherwise IMDS cannot decide which to use.
- A successfully issued token can still be refused by the target if the identity lacks the
  right Azure RBAC role assignment.
