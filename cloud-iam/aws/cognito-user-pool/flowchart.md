# Cognito User Pool Sign-In — Decision Flowchart

Authentication and challenge branching from sign-in to issued tokens, with error
terminals.

```mermaid
flowchart TD
    Start(["User starts sign-in at Hosted UI"]) --> Fed{"Federated sign-in<br/>chosen?"}
    Fed -->|Yes| Ext["Complete OIDC/SAML with external IdP,<br/>map attributes to pool user"] --> Issue
    Fed -->|No| Cred["Submit username + password<br/>(SRP proof)"]

    Cred --> CredOK{"Password proof valid?"}
    CredOK -->|No| ErrCred(["NotAuthorized: invalid credentials"])
    CredOK -->|Yes| Force{"NEW_PASSWORD_REQUIRED<br/>challenge?"}

    Force -->|Yes| NewPw["User sets new password"] --> Mfa
    Force -->|No| Mfa{"MFA configured?"}

    Mfa -->|Yes| MfaOK{"TOTP / SMS code valid?"}
    MfaOK -->|No| ErrMfa(["NotAuthorized: MFA failed"])
    MfaOK -->|Yes| Issue
    Mfa -->|No| Issue["Issue id/access/refresh JWTs"]

    Issue --> Code["Return authorization code,<br/>app exchanges with PKCE verifier"]
    Code --> Verify{"Token valid at API?<br/>(JWKS sig, iss, aud, exp,<br/>token_use, scopes)"}
    Verify -->|No| ErrTok(["401: token rejected"])
    Verify -->|Yes| OK(["Authenticated session, API access"])
```

Notes

- The PKCE verifier check happens at the token endpoint; the API-side gate re-verifies the
  token independently via JWKS.
- Federation short-circuits the password step but still routes through pool token issuance.
- `token_use` must match the context — `id` for identity, `access` for API authorization.
