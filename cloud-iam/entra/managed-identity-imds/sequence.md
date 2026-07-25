# Managed Identity via IMDS — Sequence Diagram

Happy path first (a VM with a system-assigned identity gets a token and calls Key Vault), then
alternates: user-assigned selection, the App Service variant, and a missing metadata header.

```mermaid
sequenceDiagram
    autonumber
    participant App as App (on Azure resource)
    participant IMDS as Azure IMDS 169.254.169.254
    participant Entra as Microsoft Entra ID
    participant API as Protected API

    App->>IMDS: GET /metadata/identity/oauth2/token<br/>?api-version=2018-02-01&resource=https://vault.azure.net<br/>Header Metadata: true
    IMDS->>Entra: Request token for system-assigned identity
    Entra-->>IMDS: access_token (JWT), token_type Bearer, expires_in
    IMDS-->>App: 200 JSON access_token
    App->>API: GET /secrets/... Authorization: Bearer <token>
    API->>Entra: Validate signature via JWKS, iss, aud, exp
    Entra-->>API: Valid
    API-->>App: 200 secret value

    alt User-assigned identity
        App->>IMDS: GET ...&resource=...&client_id=<guid><br/>Metadata: true
        alt Exactly one identity resolved
            IMDS->>Entra: Token for that user-assigned identity
            Entra-->>IMDS: access_token
            IMDS-->>App: 200 token
        else Ambiguous (multiple attached, none specified)
            IMDS-->>App: 400 multiple user-assigned identities,<br/>specify client_id/object_id/mi_res_id
        end
    end

    alt App Service / Functions variant
        App->>IMDS: GET %IDENTITY_ENDPOINT%?resource=...&api-version=2019-08-01<br/>Header X-IDENTITY-HEADER: <secret>
        IMDS-->>App: 200 access_token (same shape)
    end

    alt Missing Metadata header (SSRF probe)
        App->>IMDS: GET .../token without Metadata: true
        IMDS-->>App: 400 Bad Request (header required)
    end
```

Notes

- System-assigned needs no identity parameter, user-assigned must disambiguate via `client_id`,
  `object_id`, or `mi_res_id`.
- App Service and Functions use `IDENTITY_ENDPOINT` + `X-IDENTITY-HEADER` instead of the
  link-local address, the token shape is identical.
- The `Metadata: true` requirement and `X-Forwarded-For` rejection blunt naive SSRF.
