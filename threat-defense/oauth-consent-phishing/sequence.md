---
title: "OAuth Consent Phishing — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# OAuth Consent Phishing — Sequence Diagram

The attack path (luring a victim to consent to a malicious OAuth app), then the defenses
that block it (admin-consent workflow, publisher verification) or detect and revoke it
(app governance). The **Attacker** never learns the victim's password.

```mermaid
sequenceDiagram
    autonumber
    actor Atk as Attacker
    actor Victim
    participant IdP as IdP (authorization server)
    participant API as API (mail / files)
    participant Gov as Defender / App governance

    Note over Atk,IdP: Attacker registers or impersonates an OAuth app,<br/>requesting scopes like Mail.Read plus offline_access

    Atk->>Victim: Phishing lure - "open this document viewer"<br/>link to a real /authorize URL for the malicious app
    Victim->>IdP: Follow link, authenticate (+ MFA) at the real IdP

    alt Publisher unverified and policy blocks it (attack prevented)
        IdP-->>Victim: App from unverified publisher - consent blocked
        Note over Victim,IdP: No tokens issued, phishing app never granted
    else Requested scopes exceed user-consent policy
        IdP->>Gov: Route to admin-consent approval request
        Gov->>Gov: Reviewer inspects app, publisher, reply URL, scopes
        Gov-->>Victim: Deny - unknown app, request rejected
    else User consent allowed for these scopes
        IdP->>Victim: Consent screen - app requests Mail.Read, offline_access
        Victim->>IdP: Click Accept (socially engineered)
        IdP-->>Atk: Authorization code to attacker reply URL
        Atk->>IdP: POST /token - exchange code for tokens
        IdP-->>Atk: access_token + refresh_token for consented scopes
        Atk->>API: Read mailbox / files with access_token
        API-->>Atk: Data returned

        opt Detection and revocation - app governance
            API->>Gov: Telemetry - new app mass-reading many items
            Gov->>Gov: Rare app + high-impact scopes + burst reads = risky
            Gov->>IdP: Revoke app grant and refresh tokens
            IdP-->>Atk: Refresh fails, access_token expires - access cut off
            Gov-->>Victim: Notify, force review of granted apps
        end
    end
```

Notes

- Every IdP step is legitimate: the login, MFA, and token issuance are all real. The defect is
  that a human was tricked into **authorizing** an attacker's client.
- Prevention lives in **consent policy** (publisher verification, admin-consent workflow);
  detection and containment live in **app governance** revoking the grant and refresh tokens.
- Because MFA is satisfied during the victim's own login, MFA alone does **not** stop this attack.
