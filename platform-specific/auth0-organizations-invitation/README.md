# Auth0 Organizations — B2B Invitation & Org-Context Login

**Status:** ✅ Current

**Auth0 Organizations** model B2B tenancy: an **Organization** groups members,
enabled **connections** (identity providers), and **roles**. This diagram covers the
**invitation lifecycle** and **organization-context login**:

1. An admin **invites a member** to an organization (email + assigned roles).
2. The invitee **accepts the invitation** (an invitation ticket URL that carries the
   `organization` and `invitation` parameters).
3. Auth0 completes login **in the organization's context** — the app passes the
   `organization` parameter to `/authorize`, so the user authenticates against a
   **connection enabled for that org**, and the issued tokens carry the `org_id`
   claim plus the member's org-scoped roles.

## What makes this Auth0-specific (vs the generic flow)

The login is still the standard
[OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) flow —
not re-drawn here. What is Auth0-specific is the **organization dimension**: the
`organization` + `invitation` parameters on `/authorize`, the invitation ticket, the
per-org **enabled connections** (a user can only use IdPs the org allows), the
**membership + org-scoped roles**, and the `org_id` token claim that downstream apps
authorize against.

## When it is used

- B2B SaaS where each customer is an Organization with its own SSO connection and
  roles.
- Inviting external collaborators or new employees into a specific tenant.
- Enforcing that a login happens in exactly one organization's context (branding,
  connection, roles).

## Actors

| Actor | Role |
|---|---|
| Admin | Org administrator who sends the invitation and assigns roles |
| Invitee | The user being invited (new or existing) |
| App | The B2B application passing the `organization` parameter |
| Auth0 Tenant | Auth0 tenant: Organizations, invitations, connections, membership, roles |
| Email | Delivery channel for the invitation ticket link |

## Alternate scenarios covered

- **Existing vs new user** — an existing Auth0 user is added as a member directly; a
  new user completes sign-up as part of accepting the invite.
- **Invitation expiry** — the invitation ticket has passed its TTL; acceptance is
  rejected and a new invite is required.
- **Connection restricted to org** — the invitee's IdP is not an enabled connection
  for the organization, so login in that org context is refused.

## Related diagrams

- [OIDC Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the login flow the `organization` parameter augments.
- [Auth0 Universal Login + Actions](../auth0-universal-login-actions/README.md) — Actions can read `event.organization` and enforce membership.
- [SCIM Provisioning](../../user-lifecycle/scim-provisioning/README.md) — bulk B2B membership as an alternative to per-user invites.
- [SAML SP-Initiated SSO](../../saml/sp-initiated-sso/README.md) — an org's enabled connection may itself be enterprise SAML.

## Files

- [sequence.md](sequence.md) — invite, email ticket, accept, org-context `/authorize`, tokens with `org_id`; alts.
- [swimlane.md](swimlane.md) — lanes for Admin, Invitee, App, Auth0 Tenant, Email.
- [flowchart.md](flowchart.md) — invitation validation, existing/new user, connection restriction with error terminals.
