---
title: "IAM Identity Center SSO — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IAM Identity Center SSO — Sequence Diagram

Happy path first: portal sign-in, pick an account + permission set, get temporary
credentials. Then alternates: external SAML IdP as source, CLI `aws sso login` device
flow, and no assignment for the chosen account.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Browser/CLI
    participant IC as IAM Identity Center
    participant STS as STS
    participant Acct as Target account

    User->>Client: Open AWS access portal
    Client->>IC: Authenticate (Identity Center directory)
    IC->>IC: Verify credentials + MFA, create SSO session
    IC-->>Client: Portal: accounts and permission sets<br/>the user is assigned
    User->>Client: Choose account + permission set

    Client->>IC: Request credentials for<br/>(account, permission set)
    IC->>IC: Confirm account assignment exists
    IC->>STS: AssumeRole into AWSReservedSSO_<permset> role
    STS-->>IC: Temporary credentials
    IC-->>Client: Short-lived credentials / console sign-in
    Client-->>User: Console or CLI session in the account

    alt External SAML IdP as identity source
        Client->>IC: Redirect to corporate IdP
        IC-->>Client: SAML SSO (see saml/sp-initiated-sso)
        Client->>IC: SAMLResponse establishes SSO session
    end

    alt CLI: aws sso login (device / auth-code + PKCE)
        User->>Client: Run aws sso login
        Client->>IC: Start OAuth device authorization + PKCE
        IC-->>Client: user_code + verification URL
        User->>IC: Approve in browser, authenticate
        IC-->>Client: SSO OIDC access token
        Client->>IC: sso:GetRoleCredentials(accountId, roleName, accessToken)
        IC->>STS: AssumeRole into permission-set role
        STS-->>IC: Temporary credentials
        IC-->>Client: Role credentials cached under ~/.aws/sso/cache
    end

    alt No assignment for the chosen account
        Client->>IC: Request credentials for unassigned account
        IC-->>Client: Access denied - no assignment
    end

    alt SSO access token expired
        Client->>IC: sso:GetRoleCredentials with stale token
        IC-->>Client: 401 - re-run aws sso login
    end
```

Notes

- Identity Center never hands out long-lived keys; every path ends in an STS
  `AssumeRole` into the permission-set role.
- Permission sets are provisioned as IAM roles named
  `AWSReservedSSO_<PermissionSetName>_<hash>` in each assigned account.
- The CLI flow reuses OAuth device authorization / authorization code with PKCE — see
  [OIDC Authorization Code + PKCE](../../../../authentication/oidc/authorization-code-pkce/README.md).
