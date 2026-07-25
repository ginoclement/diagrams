# Step-Up Authentication — Sequence Diagram

Happy path first (sensitive action triggers step-up, user satisfies it), then the
already-sufficient, freshness-only, and step-up-failed alternates. Uses the RFC 9470
`insufficient_user_authentication` challenge to trigger elevation.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Client
    participant API as API
    participant IdP as IdP

    User->>Client: Request sensitive action<br/>(e.g. approve wire transfer)
    Client->>API: Call with current access_token
    API->>API: Check required acr / auth_time for this action
    API-->>Client: 401 WWW-Authenticate:<br/>insufficient_user_authentication,<br/>acr_values="phr", max_age=300

    Client->>IdP: Re-authorize with acr_values=phr<br/>and max_age=300 (RFC 9470)
    IdP->>IdP: Compare session assurance to request

    alt Step-up required and satisfied
        IdP->>User: Challenge stronger factor<br/>(FIDO2 / passkey)
        User->>IdP: Complete challenge
        IdP-->>Client: New tokens<br/>acr=phr, fresh auth_time
        Client->>API: Retry action with elevated token
        API->>API: acr and auth_time now satisfy policy
        API-->>Client: 200 action performed
        Client-->>User: Action confirmed
    else Session already satisfies requirement
        IdP-->>Client: Tokens returned without re-prompt<br/>(acr / auth_time already sufficient)
        Client->>API: Retry action
        API-->>Client: 200 action performed
    else Freshness only (factor strong, too old)
        IdP->>User: Re-prompt same factor (max_age exceeded)
        User->>IdP: Re-authenticate
        IdP-->>Client: Tokens with fresh auth_time
        Client->>API: Retry action
        API-->>Client: 200 action performed
    else Step-up failed or cancelled
        User--x IdP: Abandons / fails challenge
        IdP-->>Client: No elevated token issued
        Client-->>User: Sensitive action refused<br/>(base session stays valid)
    end
```

Notes

- `acr_values="phr"` is illustrative shorthand for a phishing-resistant authentication
  context class; deployments use their own registered class URIs.
- The API re-checks `acr` and `auth_time` on the **retry** — the elevation is proven by the
  token's claims, never by the client asserting "we prompted".
- A failed step-up refuses only the sensitive action; the user's existing session and
  routine access are untouched.
