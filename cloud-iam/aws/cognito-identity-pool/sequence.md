---
title: "Cognito Identity Pool — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cognito Identity Pool — Sequence Diagram

Happy path first: enhanced flow exchanging a user-pool ID token for AWS credentials.
Alternates: guest (unauthenticated) access, role-mapping by claim, the classic
web-identity flow, and an invalid token.

```mermaid
sequenceDiagram
    autonumber
    participant App as App (mobile/web)
    participant LP as Login Provider
    participant IP as Identity Pool
    participant STS as STS
    participant API as AWS Service API

    App->>LP: Authenticate (see cognito-user-pool)
    LP-->>App: ID token (JWT)
    App->>IP: GetId(IdentityPoolId, Logins={provider: idToken})
    IP-->>App: IdentityId
    App->>IP: GetCredentialsForIdentity(IdentityId, Logins)
    IP->>IP: Validate token, apply role mapping<br/>-> authenticated role
    IP->>STS: AssumeRole (server-side) for authenticated role
    STS-->>IP: Temporary credentials
    IP-->>App: {AccessKeyId, SecretAccessKey, SessionToken, Expiration}
    App->>API: SigV4-signed request with temp creds
    API-->>App: 200 data

    alt Guest access (empty Logins)
        App->>IP: GetId(IdentityPoolId) with no Logins
        IP-->>App: IdentityId (unauthenticated)
        App->>IP: GetCredentialsForIdentity (no Logins)
        IP->>IP: Select unauthenticated role<br/>(amr = unauthenticated)
        IP-->>App: Guest-scoped temporary credentials
    end

    alt Role mapping by token claim
        App->>IP: GetCredentialsForIdentity with ID token
        IP->>IP: Rule matches claim (e.g. group)<br/>-> maps to a specific role
        IP-->>App: Credentials for the mapped role
    end

    alt Classic (basic) flow
        App->>IP: GetOpenIdToken(IdentityId, Logins)
        IP-->>App: Cognito OIDC token<br/>(iss = cognito-identity.amazonaws.com)
        App->>STS: AssumeRoleWithWebIdentity(RoleArn, token)
        STS-->>App: Temporary credentials
    end

    alt Invalid or expired provider token
        App->>IP: GetCredentialsForIdentity with stale token
        IP-->>App: NotAuthorizedException
    end
```

Notes

- Enhanced flow (default) hides the STS call: Cognito assumes the role server-side using the
  pool's role-mapping config and returns credentials directly.
- Classic flow exposes `AssumeRoleWithWebIdentity` — see
  [AssumeRoleWithWebIdentity](../assumerole-web-identity-oidc/README.md).
- The `Logins` map keys the token to a provider; an empty map requests the guest role,
  which must be tightly scoped.
