---
title: "B2B Guest Invitation and Redemption — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# B2B Guest Invitation and Redemption — Decision Flowchart

Selecting the redemption path and passing cross-tenant + Conditional Access gates. Deny
paths terminate explicitly.

```mermaid
flowchart TD
    Start(["Guest opens redemption link<br/>or accesses a shared resource"]) --> Xtap{"Cross-tenant access<br/>allows this guest?"}
    Xtap -->|No| DenyXtap(["Deny: inbound tenant/user blocked"])
    Xtap -->|Yes| IdType{"Guest identity<br/>type?"}

    IdType -->|Entra home tenant| EntraAuth["Authenticate at home Entra"]
    IdType -->|Microsoft / Google| Social["Authenticate at social IdP"]
    IdType -->|No supported IdP| Otp["Email one-time passcode"]

    EntraAuth --> AuthOK{"Authentication<br/>succeeded?"}
    Social --> AuthOK
    Otp --> AuthOK
    AuthOK -->|No| DenyAuth(["Deny: authentication failed"])
    AuthOK -->|Yes| Trust{"Home MFA / device<br/>claims trusted?"}

    Trust -->|Yes| CA
    Trust -->|No| MfaReq{"Resource-tenant CA<br/>requires MFA?"}
    MfaReq -->|Yes| Mfa{"Guest completes<br/>MFA?"}
    Mfa -->|No| DenyMfa(["Deny: MFA not satisfied"])
    Mfa -->|Yes| CA
    MfaReq -->|No| CA["Apply remaining guest CA controls"]

    CA --> CAok{"All controls met?"}
    CAok -->|No| DenyCA(["Deny: policy unmet"])
    CAok -->|Yes| Grant(["Guest object redeemed,<br/>token issued, resource shared"])
```

Notes

- The cross-tenant access gate runs first — an inbound block stops redemption regardless of
  the guest's ability to authenticate.
- Trusting the home tenant's MFA avoids re-challenging the guest; otherwise resource-tenant
  Conditional Access enforces its own MFA.
- Authorization to the specific resource is always the resource tenant's decision, even
  though authentication happened at the guest's home IdP.
