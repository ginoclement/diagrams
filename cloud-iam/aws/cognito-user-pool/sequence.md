---
title: "Cognito User Pool Sign-In — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cognito User Pool Sign-In — Sequence Diagram

Happy path first: Hosted UI Authorization Code + PKCE producing pool JWTs, then API use.
Alternates: MFA challenge, external-IdP federation, new-password challenge, and refresh.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as App (public client)
    participant UI as Cognito Hosted UI
    participant Pool as User Pool
    participant API as Resource API

    App->>App: Generate code_verifier,<br/>code_challenge = S256(verifier)
    App->>UI: GET /oauth2/authorize?response_type=code<br/>&client_id&redirect_uri&scope=openid<br/>&code_challenge&code_challenge_method=S256
    UI->>User: Login page
    User->>UI: Enter username + password
    UI->>Pool: InitiateAuth (USER_SRP_AUTH)
    Pool->>Pool: Verify SRP proof (password never sent)
    Pool-->>UI: Authentication result
    UI-->>App: 302 redirect_uri?code=...&state
    App->>UI: POST /oauth2/token grant_type=authorization_code<br/>&code&redirect_uri&client_id&code_verifier
    UI-->>App: id_token + access_token + refresh_token (RS256 JWTs)
    App->>App: Validate id_token (JWKS, iss, aud, exp, token_use=id)
    App->>API: GET /resource (Bearer access_token)
    API->>API: Verify access_token via JWKS (iss, exp, token_use=access, scopes)
    API-->>App: 200 data

    alt MFA required
        Pool-->>UI: Challenge SOFTWARE_TOKEN_MFA / SMS_MFA
        UI->>User: Prompt for TOTP / SMS code
        User->>UI: Enter code
        UI->>Pool: RespondToAuthChallenge(code)
        alt Code valid
            Pool-->>UI: Tokens issued
        else Code invalid
            Pool-->>UI: NotAuthorizedException
            UI-->>User: MFA failed
        end
    end

    alt Federated sign-in (external IdP)
        User->>UI: Choose "Sign in with Google / corporate IdP"
        UI->>UI: Complete OIDC/SAML with external IdP
        UI->>Pool: Map attributes to a linked pool user
        Pool-->>UI: Pool issues its own id/access/refresh tokens
    end

    alt New password required (admin-created / forced reset)
        Pool-->>UI: Challenge NEW_PASSWORD_REQUIRED
        UI->>User: Prompt for new password
        User->>UI: Set new password
        UI->>Pool: RespondToAuthChallenge(new password)
        Pool-->>UI: Tokens issued
    end

    alt Access token expired
        App->>UI: POST /oauth2/token grant_type=refresh_token
        UI-->>App: New id_token + access_token
    end
```

Notes

- The Hosted UI exchange is exactly the OIDC
  [Authorization Code + PKCE](../../../oidc/authorization-code-pkce/README.md) flow; Cognito
  is the OpenID Provider.
- `USER_SRP_AUTH` proves the password without transmitting it; MFA is a follow-on challenge
  via `RespondToAuthChallenge`.
- These tokens authenticate the user to the app/API only. For AWS IAM credentials, exchange
  the ID token at a [Cognito identity pool](../cognito-identity-pool/README.md).
