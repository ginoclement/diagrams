# B2B Guest Invitation and Redemption (Entra External ID)

**Status:** ✅ Current

## What it is

Entra External ID B2B collaboration lets a **resource tenant** invite an external person as
a **guest** and share apps/resources with them without creating a password-backed account.
An inviter sends an invitation; Entra creates a guest **user object** (`userType=Guest`,
UPN of the form `user_externaldomain#EXT#@resourcetenant.onmicrosoft.com`) and emails a
redemption link. On **redemption** the guest authenticates against **their own home
identity provider** — their home Entra tenant, a Microsoft/Google account, email one-time
passcode (OTP), or a federated SAML/OIDC IdP — and consents. Thereafter the guest signs in
with their home credentials, but authorization, Conditional Access, and **cross-tenant
access settings** are enforced by the resource tenant.

## When it is used

- Sharing SharePoint/Teams/apps with partners, vendors, and contractors without
  provisioning them full internal accounts.
- Cross-tenant collaboration where the partner already has Entra (home tenant does the
  authentication; resource tenant does authorization).

## Actors

| Actor | Role |
|---|---|
| Inviter | Resource-tenant user or admin who sends the invitation |
| Guest | External person being invited |
| ResourceTenant | Entra tenant sharing the resource, owns the guest object + access policy |
| HomeIdP | Guest's own identity provider that authenticates them |
| App | Application in the resource tenant the guest is granted |

## Alternate scenarios covered

- Guest's home tenant is Entra — cross-tenant trust and (optionally) inbound MFA/device
  trust honored.
- Guest has a Microsoft/Google account — social IdP redemption.
- Email one-time passcode (OTP) for guests with no supported IdP.
- Cross-tenant access settings block an inbound tenant/user (denied redemption).
- Just-in-time redemption at first app access (no email link clicked).
- Guest already redeemed — subsequent sign-in with home credentials.

## Security notes

- Configure **cross-tenant access settings** (inbound/outbound) to allow only intended
  partner tenants, and decide whether to **trust** the home tenant's MFA and device claims
  rather than re-challenging.
- Conditional Access in the resource tenant applies to guests; require MFA for guest access
  since you do not control their home account hygiene.
- Guest lifecycle: use access reviews to remove stale guests; guests can be blocked or
  deleted in the resource tenant independently of their home account.
- Restrict who can invite guests and whether guests can invite others; limit guest
  visibility into the directory.

## Related diagrams

- [Conditional Access Evaluation](../conditional-access-evaluation/README.md) — applied to guests in the resource tenant
- [Workload Identity Federation](../workload-identity-federation/README.md) — federating an external IdP for workloads (contrast)
- [Hybrid Identity Sync](../hybrid-identity-sync/README.md) — how internal identities arrive (contrast with external)
- [SAML SP-initiated SSO](../../../saml/sp-initiated-sso/README.md) — federation protocol behind SAML-based home IdPs
- [OIDC Authorization Code + PKCE](../../../oidc/authorization-code-pkce/README.md) — the sign-in protocol at redemption
- [Guest / external persona](../../../personas/README.md) — persona variance for external users

## Files

- [sequence.md](sequence.md) — invitation, redemption at home IdP, and access alternates
- [swimlane.md](swimlane.md) — lanes for Inviter, Guest, Resource Tenant, Home IdP, App
- [flowchart.md](flowchart.md) — redemption path selection and cross-tenant policy gates
