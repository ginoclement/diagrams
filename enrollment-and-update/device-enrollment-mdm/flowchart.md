---
title: "Device Enrollment (MDM) — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Device Enrollment (MDM) — Decision Flowchart

Decision logic from enrollment type through user authentication, profile install,
compliance evaluation, and identity-certificate issuance, with quarantine and wipe
terminals.

```mermaid
flowchart TD
    Start(["Device begins enrollment"]) --> Kind{"Enrollment type?"}

    Kind -->|"BYOD (user-driven)"| Auth{"User authentication<br/>succeeds?"}
    Kind -->|"Supervised / corporate"| Super["Apply supervised,<br/>non-removable profile"]

    Auth -->|no| EAuth(["Deny: cannot enroll<br/>without verified identity"])
    Auth -->|yes| Consent{"User consents<br/>to management?"}
    Consent -->|no| ECon(["Enrollment abandoned"])
    Consent -->|yes| Install
    Super --> Install["Install management profile,<br/>register MDM push"]

    Install --> Comp{"Compliance policy passes?<br/>(encryption, passcode,<br/>OS version, not jailbroken)"}
    Comp -->|no| Quar(["Quarantine: block access,<br/>show remediation"])
    Quar --> Remed{"Remediated and<br/>re-checked?"}
    Remed -->|no| Quar
    Remed -->|yes| Cert
    Comp -->|yes| Cert["Generate on-device key pair,<br/>submit CSR"]

    Cert --> Issue{"CA issues<br/>identity certificate?"}
    Issue -->|no| EIssue(["Enrollment fails:<br/>no device identity"])
    Issue -->|yes| Trust(["Device managed + compliant,<br/>trusted for conditional access"])

    Trust --> Drift{"Later posture<br/>drifts out of policy?"}
    Drift -->|yes| Quar
    Drift -->|"unenroll / lost / terminated"| Wipe(["Selective or full wipe,<br/>revoke device trust"])
```
