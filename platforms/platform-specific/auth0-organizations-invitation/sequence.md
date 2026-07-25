---
title: "Auth0 Organizations Invitation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Auth0 Organizations Invitation — Sequence Diagram

Happy path: admin invites a member, Auth0 emails an invitation ticket, the invitee
accepts, and login proceeds **in the organization context** (the app passes the
`organization` parameter to the standard
[OIDC Authorization Code + PKCE](../../../authentication/oidc/authorization-code-pkce/README.md) flow),
yielding tokens with `org_id` and org-scoped roles. Alternates: existing vs new user,
expiry, connection restricted to org.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    actor Invitee
    participant App
    participant Auth0 as Auth0 Tenant
    participant Email

    %% ----- happy path -----
    Admin->>App: Invite user to Organization (email, roles)
    App->>Auth0: POST create organization invitation
    Auth0->>Auth0: Create invitation ticket<br/>(org_id, roles, TTL)
    Auth0->>Email: Send invitation link<br/>(carries organization + invitation params)
    Email-->>Invitee: Invitation email
    Invitee->>App: Click invitation link
    App->>Auth0: GET /authorize (organization, invitation, PKCE, state)
    Auth0->>Auth0: Validate invitation ticket + org membership intent
    Auth0->>Auth0: Restrict login to connections enabled for this org
    Auth0-->>Invitee: Universal Login (org branding + allowed connections)
    Invitee->>Auth0: Authenticate / sign up
    Auth0->>Auth0: Add user as member of organization,<br/>assign invited roles
    Auth0->>Auth0: Mint authorization code (org context)
    Auth0-->>Invitee: Redirect to App callback with code
    Invitee->>App: GET /callback?code=...
    App->>Auth0: POST /oauth/token (code + PKCE verifier)
    Auth0-->>App: Tokens incl. org_id claim + org-scoped roles
    App-->>Invitee: Signed in to the organization

    %% ----- alternates -----
    alt Existing vs new user
        alt Existing Auth0 user
            Auth0->>Auth0: Link invitation to existing identity,<br/>add membership directly
        else New user
            Auth0->>Invitee: Sign-up form
            Invitee->>Auth0: Create account, then join org
        end
    end

    alt Invitation expired
        Invitee->>App: Click old invitation link
        App->>Auth0: GET /authorize (invitation)
        Auth0->>Auth0: Ticket past TTL
        Auth0-->>Invitee: Invitation expired - request a new invite
    end

    alt Connection restricted to org
        Invitee->>Auth0: Attempt login with a connection<br/>not enabled for this org
        Auth0->>Auth0: Connection not in org's enabled list
        Auth0-->>Invitee: Login refused for this organization
    end
```
