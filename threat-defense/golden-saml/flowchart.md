---
title: "Golden SAML — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Golden SAML — Decision Flowchart

Where each control forces a **deny** (prevention) or **detect** terminal. The signature
gate always passes for a forgery — so detection depends on log correlation, not crypto.

```mermaid
flowchart TD
    Start(["Attacker has compromised<br/>the federation server"]) --> KeyQ{"Token-signing key<br/>exportable?"}
    KeyQ -->|"No - HSM / non-exportable"| Deny1(["DENY: no key,<br/>forgery impossible"])
    KeyQ -->|Yes - soft key store| Forge["Forge + sign assertion<br/>for chosen identity"]

    Forge --> Submit["Submit forged SAMLResponse<br/>to SP ACS URL"]
    Submit --> SigQ{"Signature valid vs<br/>trusted IdP cert?"}
    SigQ -->|"No (key already rotated)"| Deny2(["DENY: signature fails,<br/>trust re-anchored"])
    SigQ -->|Yes| LifeQ{"Within short<br/>assertion lifetime?"}
    LifeQ -->|"No - NotOnOrAfter expired"| Deny3(["DENY: stale assertion"])
    LifeQ -->|Yes| Sess["SP creates session"]

    Sess --> CorrQ{"SIEM: matching IdP<br/>authentication event?"}
    CorrQ -->|"No auth event"| Detect1(["DETECT: golden assertion<br/>revoke session, isolate host,<br/>rotate key twice"])
    CorrQ -->|Yes| AnomQ{"Assertion anomalies?<br/>impossible travel, odd groups,<br/>account never uses SSO"}
    AnomQ -->|Yes| Detect2(["DETECT: anomalous assertion<br/>investigate"])
    AnomQ -->|No| Gap(["Residual risk:<br/>forgery indistinguishable<br/>- shrink lifetimes, prefer CAE"])
```

Notes

- The **signature gate never stops a fresh forgery** — it only helps *after* key rotation
  invalidates the stolen key. That is why HSM prevention (`KeyQ`) and log correlation
  (`CorrQ`) carry the defense.
- `CorrQ` (SP success with no IdP auth) is the highest-fidelity detection and should be a
  standing SIEM rule.
- The `Gap` terminal is honest about residual risk: a perfectly-formed, short-lived forgery
  with a real-looking profile is hard to catch, which is why continuous access evaluation
  and phishing-resistant primary auth reduce reliance on static SAML trust.
