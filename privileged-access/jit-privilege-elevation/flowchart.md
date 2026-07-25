---
title: "Just-In-Time Privilege Elevation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Just-In-Time Privilege Elevation — Decision Flowchart

Every gate between an eligible identity and an active, time-bound role, plus the
auto-revoke back to zero standing privilege.

```mermaid
flowchart TD
    S(["Eligible admin requests activation"]) --> Elig{"Eligible assignment<br/>exists for role + scope?"}
    Elig -->|No| DenyElig(["Deny: not eligible"])
    Elig -->|Yes| Just{"Justification /<br/>ticket provided?"}
    Just -->|No| DenyJust(["Deny: justification required"])
    Just -->|Yes| Risk{"Sign-in risk and<br/>conditions acceptable?"}
    Risk -->|No| DenyRisk(["Deny: risky sign-in / blocked location"])
    Risk -->|Yes| MFA{"Fresh phishing-resistant<br/>MFA passed?"}
    MFA -->|No| DenyMFA(["Deny: step-up failed"])
    MFA -->|Yes| Appr{"Approval<br/>required?"}

    Appr -->|Yes| Dec{"Approved in<br/>time window?"}
    Dec -->|No| DenyAppr(["Deny: not approved / expired"])
    Dec -->|Yes| Grant["Write time-bound<br/>active assignment (TTL)"]
    Appr -->|No - auto| Grant

    Grant --> Use["Admin uses privileged role"]
    Use --> Exit{"Window expired or<br/>early deactivation?"}
    Exit -->|Still within window| Use
    Exit -->|Expired / deactivated| Revoke["Remove active assignment"]
    Revoke --> Zero(["Back to eligible-only:<br/>zero standing privilege"])
```

Notes

- The gates are ordered cheap-to-expensive: eligibility and justification are checked
  before the interactive MFA and approval steps.
- Every deny terminal leaves standing state untouched — a denied activation never grants
  anything, so the resting posture is always unprivileged.
- The `Use` self-loop plus the single `Revoke` exit models both natural expiry and early
  deactivation converging on the same guaranteed return to zero standing privilege.
