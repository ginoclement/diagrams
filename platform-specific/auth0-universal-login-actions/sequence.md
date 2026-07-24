# Auth0 Universal Login + Actions — Sequence Diagram

Happy path: app hits `/authorize`, user authenticates at Universal Login, Auth0 runs
the ordered post-login Actions (enrich claims, optional MFA), then issues tokens via
the standard [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md)
exchange. Alternates: redirect-and-resume, deny, M2M client-credentials-exchange.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App
    participant Auth0 as Auth0 Tenant
    participant Action
    participant Ext as External API

    %% ----- happy path -----
    User->>App: Click "Log in"
    App-->>User: Redirect to Auth0 /authorize (PKCE, state)
    User->>Auth0: GET /authorize
    Auth0-->>User: Universal Login page
    User->>Auth0: Submit credentials / social / passkey
    Auth0->>Auth0: Authentication succeeds - start post-login pipeline
    loop Ordered post-login Actions
        Auth0->>Action: Run Action (event, api)
        opt Enrich token
            Action->>Ext: Fetch roles / entitlements
            Ext-->>Action: Attributes
            Action->>Action: api.idToken.setCustomClaim(...)<br/>api.accessToken.setCustomClaim(...)
        end
        opt Adaptive MFA
            Action->>Action: Risk high - api.multifactor.enable("any")
        end
        Action-->>Auth0: Action complete
    end
    opt MFA was enabled
        Auth0-->>User: MFA challenge
        User->>Auth0: Complete MFA
    end
    Auth0->>Auth0: Pipeline done - mint authorization code
    Auth0-->>User: Redirect to App callback with code
    User->>App: GET /callback?code=...
    App->>Auth0: POST /oauth/token (code + PKCE verifier)
    Auth0-->>App: ID token + access token (with custom claims)
    App-->>User: Logged in

    %% ----- alternates -----
    alt Action redirects out and resumes
        Auth0->>Action: Run Action
        Action->>Action: api.redirect.encodeToken(state, payload)
        Action-->>Auth0: Redirect requested
        Auth0-->>User: 302 to your custom page (signed state token)
        User->>Ext: Complete step (consent / extra profile)
        Ext-->>User: Redirect back to /continue with session_token
        User->>Auth0: GET /continue
        Auth0->>Action: Resume Action (reads api.redirect.validateToken)
        Action-->>Auth0: Pipeline resumes
    end

    alt Action denies access
        Auth0->>Action: Run Action
        Action->>Action: api.access.deny("reason")
        Action-->>Auth0: Deny
        Auth0-->>User: Login blocked - no tokens issued
    end

    alt Machine-to-machine (client-credentials-exchange trigger)
        App->>Auth0: POST /oauth/token grant_type=client_credentials
        Auth0->>Action: Run credentials-exchange Action (no user)
        Action->>Action: api.accessToken.setCustomClaim(...) / api.access.deny(...)
        Action-->>Auth0: Complete
        Auth0-->>App: Access token (custom claims, no id token)
    end
```
