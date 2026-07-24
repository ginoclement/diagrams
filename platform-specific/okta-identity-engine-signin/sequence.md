# Okta Identity Engine Sign-In — Sequence Diagram

Happy path: app redirects to Okta `/authorize`, the Identity Engine runs the `/idx`
remediation loop under **Global Session Policy** then the app **Authentication
Policy**, dynamically sequences factors, and returns an authorization code. Token
exchange itself is standard
[OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md).
Alternates: passwordless, inline factor enrollment, device assurance, network zone.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant App
    participant Okta as Okta (Identity Engine)
    participant Dir as Directory

    %% ----- happy path -----
    User->>Browser: Open App
    Browser->>App: GET /app
    App-->>Browser: 302 to Okta /authorize (PKCE challenge, state)
    Browser->>Okta: GET /authorize
    Okta->>Okta: Evaluate Global Session Policy<br/>(existing org session, idle/lifetime, zone)
    Note over Okta: No valid org session - start /idx remediation
    Okta-->>Browser: Sign-In Widget - remediation identify
    User->>Browser: Enter username
    Browser->>Okta: POST /idx/identify
    Okta->>Dir: Look up user, resolve enrolled authenticators
    Dir-->>Okta: User profile + factor list
    Okta->>Okta: Sequence factors from policy<br/>(next remediation select-authenticator)
    Okta-->>Browser: Challenge - password authenticator
    User->>Browser: Enter password
    Browser->>Okta: POST /idx/challenge/answer
    Okta->>Dir: Validate password
    Dir-->>Okta: Credential OK
    Okta->>Okta: Global Session satisfied - create org session cookie
    Okta->>Okta: Evaluate app Authentication Policy<br/>(assurance for THIS app)
    Note over Okta: Policy requires a second factor - continue remediation
    Okta-->>Browser: Challenge - Okta Verify push
    User->>Browser: Approve push on phone
    Browser->>Okta: POST /idx/challenge/answer (factor verified)
    Okta->>Okta: Authentication Policy satisfied<br/>issue interaction_code, mint auth code
    Okta-->>Browser: 302 back to App with authorization code
    Browser->>App: GET /callback?code=...
    App->>Okta: POST /token (code + PKCE verifier)
    Okta-->>App: ID token + access token
    App-->>Browser: App session established

    %% ----- alternates -----
    alt Passwordless (FastPass / Okta Verify as single factor)
        Okta->>Okta: Authentication Policy allows one phishing-resistant factor
        Okta-->>Browser: Challenge - Okta Verify FastPass (no password remediation)
        Browser->>Okta: Device-bound signed assertion
        Okta->>Okta: Both policy layers satisfied in one step
    end

    opt Factor enrollment required during sign-in
        Okta->>Okta: Policy requires factor user has not enrolled
        Okta-->>Browser: Remediation enroll-authenticator
        User->>Browser: Enroll factor (e.g. Okta Verify)
        Browser->>Okta: POST /idx/credential/enroll
        Okta->>Okta: Resume challenge with newly enrolled factor
    end

    alt Device assurance fails
        Okta->>Okta: Policy requires managed / registered device
        Okta->>Browser: Probe device signal (Okta Verify / endpoint)
        Browser-->>Okta: Device unmanaged / not registered
        Okta-->>Browser: Deny - device does not meet assurance
    end

    alt Network zone rule forces step-up or block
        Okta->>Okta: Global Session rule matches untrusted IP zone
        alt Rule action is prompt
            Okta-->>Browser: Force MFA before org session
        else Rule action is deny
            Okta-->>Browser: Access denied from this location
        end
    end
```
