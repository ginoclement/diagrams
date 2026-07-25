---
title: "OAuth Consent — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth Consent — Decision Flowchart

The consent decision from an authorization request to a scoped token or a refusal. Covers prior
grants, admin-only scopes, user approval/denial, incremental deltas, and revocation. Deny and
admin-required terminals are explicit.

```mermaid
flowchart TD
    Start(["Authorize request<br/>(client, scopes, redirect_uri)"]) --> Auth{"User<br/>authenticated?"}
    Auth -->|No| DoAuth["Authenticate user"]
    DoAuth --> Prior
    Auth -->|Yes| Prior{"Prior grant covers<br/>all requested scopes?"}

    Prior -->|Yes| Issue(["Issue code -> scoped token"])
    Prior -->|No| Admin{"Any requested scope<br/>admin-only?"}

    Admin -->|Yes| HasAdmin{"Tenant admin grant<br/>already present?"}
    HasAdmin -->|Yes| Issue
    HasAdmin -->|No| NeedAdmin(["Block: admin consent required<br/>(user cannot self-approve)"])

    Admin -->|No| Screen["Show consent screen<br/>(new scopes or delta only)"]
    Screen --> Decide{"User approves?"}
    Decide -->|No| Deny(["Deny: access_denied<br/>(no token issued)"])
    Decide -->|Yes| SaveGrant["Save / merge grant<br/>client x user x scopes"]
    SaveGrant --> Issue

    Issue --> Revoked{"Grant later<br/>revoked?"}
    Revoked -->|Yes| RePrompt(["Re-prompt next authorize<br/>+ invalidate refresh tokens"])
    Revoked -->|No| Active(["Grant active:<br/>client acts within granted scopes"])
```

Notes

- **Prior-grant check first**: an existing grant covering the requested scopes issues a token with no
  screen — consent is a per-scope-set decision, remembered until revoked.
- **Admin-only scopes cannot be self-consented**: the `NeedAdmin` terminal blocks the user and routes
  to a tenant-wide admin grant, which then satisfies `HasAdmin` for all users.
- **Incremental consent** enters at `Screen` with only the **delta** scopes and merges them into the
  existing grant (`SaveGrant`), so grants grow least-privilege rather than being broad up front.
- **Granted scopes are a ceiling, not per-object permission**: an active grant lets the client *ask*
  within scope; the resource still resolves fine-grained entitlement per request.
- **Revocation** forces a re-prompt and invalidates bound refresh tokens; short access-token
  lifetimes bound how long a revoked grant keeps working.
