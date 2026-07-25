# OAuth Consent as an Authorization Mechanism

**Status:** ✅ Current

## What it is

**Consent** is the point where a human authorizes a **client** to act on their behalf with a bounded
set of **scopes**. In OAuth2/OIDC it is a first-class authorization control: the authorization
server does not issue a token carrying a scope until that scope has been **granted** — by the user,
by an administrator, or incrementally over time. The granted scopes become the **ceiling** on the
client's delegated authority (see [Scopes, claims, entitlements](../scopes-claims-entitlements/README.md)).

Consent has several distinct forms:

- **User (individual) consent** — the resource owner sees a **consent screen** listing the client and
  the requested scopes and approves or denies. Approval creates a **stored grant** (client × user ×
  scopes) so subsequent authorizations for the same or narrower scopes can skip the screen.
- **Admin (tenant-wide) consent** — an administrator consents **on behalf of an entire
  organization**, so individual users are not prompted. Required for scopes an org marks as
  admin-only (e.g. broad directory or mail access), and used to centralize governance.
- **Incremental / step-up consent** — the client initially requests the minimum scopes and later
  requests **additional** scopes only when a feature needs them, prompting again for just the delta.
  This keeps grants least-privilege instead of asking for everything up front.
- **Consent revocation** — the user or admin **withdraws** a stored grant. New authorizations then
  re-prompt, and (where supported) existing refresh/access tokens tied to the grant are invalidated.

Consent is authorization of **delegation** — "may this app do X as me?" — and is layered on top of
authentication (proving who the user is) and beneath fine-grained runtime entitlement (what the app
may touch once it holds the token).

## When it is used

- Every third-party OAuth integration: a user connecting an app to their Google/Microsoft/GitHub
  account passes through the consent screen.
- Enterprise SaaS onboarding where an admin grants an app tenant-wide so employees are not each
  prompted.
- Apps that broaden capability over their lifetime and request new scopes incrementally rather than
  demanding a large scope set at first sign-in.

## Actors and components

| Component | Role |
|---|---|
| User | Resource owner who approves or denies the requested scopes |
| Admin | Grants (or revokes) consent on behalf of a tenant/organization |
| Client | App requesting authorization for a set of scopes |
| IdP / Authorization Server | Renders the consent screen, records grants, mints scoped tokens |
| Consent/Grant store | Persists client × subject × scopes grants; consulted to skip re-prompts |
| Resource / API | Accepts tokens bounded by the granted scopes |

## Alternate scenarios covered

- **Prior grant covers request** — a stored grant already includes the requested scopes → consent
  screen is skipped and a token is issued directly.
- **User denies consent** — the authorization server returns `access_denied`; no token is issued.
- **Admin consent required** — a requested scope is admin-only; the user is blocked and routed to an
  admin-consent request instead of self-approving.
- **Incremental consent** — a previously granted client requests **additional** scopes; only the new
  scopes are shown and merged into the existing grant.
- **Step-up consent** — a sensitive action triggers a fresh consent (and possibly re-authentication)
  for elevated scopes.
- **Consent revoked** — a withdrawn grant forces re-prompt on the next authorization and invalidates
  tokens bound to that grant.

## Security notes

- **Consent bounds delegation, not per-object access.** Granting `mail.read` lets the app read mail
  as the user; it is not permission on any specific message — the resource still applies runtime
  entitlement. Never treat a granted scope as fine-grained authorization.
- **Least privilege via incremental consent.** Request the minimum scopes to start and add scopes
  only when needed. Broad up-front consent is both poor UX and a large blast radius if the client is
  compromised.
- **Guard against consent phishing / illicit grant attacks.** Attackers lure users into consenting a
  malicious app to broad scopes; defenses include admin consent policies, publisher verification,
  restricting who may consent, and anomaly detection on new grants.
- **Admin consent is powerful and must be governed.** One admin approval authorizes an app for every
  user in the tenant — review requested scopes, prefer verified publishers, and audit tenant-wide
  grants.
- **Revocation must be effective.** Withdrawing a grant should invalidate associated refresh tokens
  and force re-consent; short access-token lifetimes bound the window where a revoked grant still
  works.
- **Bind consent to a validated request.** Use PKCE and exact `redirect_uri` matching so the consent
  a user gives cannot be replayed by an attacker to obtain the code
  (see [Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md)).

## Related diagrams

- [Authorization Code](../../oidc/authorization-code/README.md) — the flow the consent step sits
  inside; consent gates code issuance.
- [Authorization Code + PKCE](../../oidc/authorization-code-pkce/README.md) — the public-client
  variant; PKCE protects the code obtained after consent.

## Files

- [sequence.md](sequence.md) — consent screen, grant storage, and prior-grant / deny / admin / incremental / revoke alternates.
- [swimlane.md](swimlane.md) — lanes for User, Admin, Client, IdP, Consent store, Resource.
- [flowchart.md](flowchart.md) — consent decision logic with explicit deny/admin-required/revoked terminals.
