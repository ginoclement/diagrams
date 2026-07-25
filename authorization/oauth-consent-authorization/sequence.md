# OAuth Consent — Sequence Diagram

Happy path first: the user is shown the consent screen, approves the requested scopes, a grant is
stored, and a scoped token is issued. Alternates: a prior grant skips the screen, the user denies,
an admin-only scope routes to admin consent, incremental consent for extra scopes, and revocation.

```mermaid
sequenceDiagram
    autonumber
    actor User
    actor Admin
    participant Client
    participant IdP as IdP (AuthZ Server)
    participant Store as Consent / Grant Store
    participant API as Resource

    User->>Client: Use feature needing profile + invoices.read
    Client->>IdP: Authorize request (scopes, redirect_uri, PKCE)
    IdP->>IdP: Authenticate user
    IdP->>Store: Existing grant for client + user covers scopes?
    Store-->>IdP: No prior grant
    IdP->>User: Consent screen (client, requested scopes)
    User->>IdP: Approve
    IdP->>Store: Save grant client x user x scopes
    IdP-->>Client: Authorization code (redirect)
    Client->>IdP: Exchange code (+ PKCE verifier)
    IdP-->>Client: Access token (scope = granted), refresh token
    Client->>API: Call API with scoped token
    API-->>Client: 200 OK

    alt Prior grant covers request
        Client->>IdP: Authorize (same/narrower scopes)
        IdP->>Store: Grant covers scopes?
        Store-->>IdP: Yes
        IdP-->>Client: Code without re-prompt
    else User denies consent
        IdP->>User: Consent screen
        User->>IdP: Deny
        IdP-->>Client: error = access_denied (no token)
    else Admin consent required
        IdP->>User: Requested scope is admin-only
        IdP-->>Client: error = consent_required (admin)
        Admin->>IdP: Grant tenant-wide consent for client
        IdP->>Store: Save tenant grant (all users)
    else Incremental / step-up consent
        Client->>IdP: Authorize (adds scope invoices.write)
        IdP->>Store: Grant has read, not write
        IdP->>User: Consent screen for the delta only
        User->>IdP: Approve
        IdP->>Store: Merge new scope into existing grant
    else Consent revoked
        User->>IdP: Revoke grant for client
        IdP->>Store: Delete grant, invalidate refresh tokens
        Client->>IdP: Next authorize
        IdP->>User: Re-prompt (grant gone)
    end

    note over IdP,Store: Granted scopes are the ceiling on the client.<br/>The resource still applies runtime entitlement per object.
```

Notes

- **Grant reuse**: an existing grant that covers the requested scopes lets the authorization server
  skip the consent screen — consent is remembered per client × subject × scopes, not asked every time.
- **Admin vs user consent**: admin-only scopes cannot be self-approved; the flow diverts to a
  tenant-wide admin grant that then suppresses per-user prompts for that client.
- **Incremental consent** prompts only for the **delta** and merges it into the stored grant, keeping
  grants least-privilege instead of a single broad up-front approval.
- **Revocation** deletes the grant and invalidates bound refresh tokens, forcing re-consent on the
  next authorization; short access-token lifetimes bound the residual window.
