---
title: "Conditional Access Evaluation — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Conditional Access Evaluation — Sequence Diagram

Happy path first (policy satisfied, token issued), then alternates: MFA interrupt,
non-compliant device block, risk-based step-up, and a hard block control.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Entra as Entra
    participant IdP as IdProtection
    participant Dev as Device
    participant App as App

    User->>Browser: Navigate to cloud app
    Browser->>App: GET protected resource
    App-->>Browser: 302 redirect to Entra /authorize
    Browser->>Entra: GET /authorize (client_id, scope, redirect_uri)
    Entra->>Entra: Primary authentication (user proves identity)
    Entra->>Entra: Gather signals (user/group, app, client, location)
    Entra->>Dev: Read device state (compliant, join type)
    Dev-->>Entra: Device claims from PRT / cert
    Entra->>IdP: Request sign-in + user risk level
    IdP-->>Entra: Risk = low
    Entra->>Entra: Evaluate all matching CA policies

    alt All grant controls already satisfied
        Entra-->>Browser: 302 with code, then id_token + access_token
        Browser->>App: Present access_token
        App-->>Browser: 200 resource
        Browser-->>User: Signed-in app
    else Require MFA not yet met
        Entra-->>Browser: Interrupt: MFA challenge
        User->>Browser: Approve push / enter passwordless / FIDO2
        Browser->>Entra: MFA proof
        Entra->>Entra: satisfied_by claim recorded, re-evaluate
        Entra-->>Browser: 302 with code, token issued
    else Require compliant device, device not compliant
        Entra->>Dev: Check Intune compliance state
        Dev-->>Entra: Non-compliant / unmanaged
        Entra-->>Browser: Block, link to enroll or remediate device
    else Elevated risk (sign-in risk high)
        IdP-->>Entra: Risk = high
        Entra-->>Browser: Require MFA + secure password change
        User->>Browser: Complete MFA, reset password
        Browser->>Entra: Remediation proof
        Entra->>IdP: Remediate risk state
        Entra-->>Browser: Token issued
    else Block control matches (legacy auth or blocked location)
        Entra-->>Browser: 401 access blocked by policy, no token
    end
```

Notes

- Signals are gathered before grant controls are evaluated, commas separate list items in
  these notes to keep the diagram parseable.
- The `satisfied_by` / `amr` claims record which controls were met so the same session
  does not re-prompt unnecessarily.
- Session controls (sign-in frequency, CAE) are attached to the issued token, not shown
  as interrupts here.
