---
title: "Authentication by Persona — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Authentication by Persona — Decision Flowchart

Branch on principal type first, then on the persona-specific decisions each path must make.
Terminal states are the resulting session (or a denial).

```mermaid
flowchart TD
    Start(["Authentication request"]) --> Human{"Human<br/>principal?"}

    Human -->|No| WL{"Client credential<br/>valid? (secret / mTLS cert)"}
    WL -->|No| DenyWL(["Deny: workload auth failed"])
    WL -->|Yes| Scope{"Requested scopes<br/>allowed for client?"}
    Scope -->|No| DenyScope(["Deny: scope not granted"])
    Scope -->|Yes| TokWL(["Issue short-lived workload token"])

    Human -->|Yes| Kind{"Persona?"}

    Kind -->|workforce / contractor| Sess{"Live IdP<br/>session?"}
    Sess -->|No| Login["Corporate SSO login"]
    Sess -->|Yes| Mfa
    Login --> Mfa{"MFA satisfied?"}
    Mfa -->|No| Step["Prompt / step-up factor"] --> Mfa
    Mfa -->|Yes| Risk{"Risk high?"}
    Risk -->|Yes| Step2["Additional step-up"] --> WfOk(["Workforce session"])
    Risk -->|No| WfOk

    Kind -->|consumer| CAuth{"Method?"}
    CAuth -->|social| CoOk(["Consumer session"])
    CAuth -->|passwordless| CoOk

    Kind -->|partner / guest| Redeemed{"Invitation<br/>redeemed?"}
    Redeemed -->|No| Redeem["Redeem invite, link home realm"] --> Fed
    Redeemed -->|Yes| Fed{"Partner IdP<br/>assertion valid?"}
    Fed -->|No| DenyFed(["Deny: federation failed"])
    Fed -->|Yes| PaOk(["External-user session"])

    Kind -->|privileged| Base["Authenticate base session<br/>plus phishing-resistant step-up"]
    Base --> Jit{"PIM approval / SoD<br/>passes?"}
    Jit -->|No| DenyJit(["Deny: elevation refused"])
    Jit -->|Yes| PvOk(["Time-boxed elevated session"])
```

Notes

- The first diamond (`Human?`) is the hard fork: non-human principals never reach MFA, risk,
  or step-up — they succeed or fail on credential and scope validation alone.
- Privileged is the only human leaf gated by a **second** authority (PIM) after the IdP, and
  its success state carries an expiry, not a standing role.
- Partner and Guest share the redeem-then-federate shape; they diverge later in lifecycle and
  authorization, not at authentication.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
