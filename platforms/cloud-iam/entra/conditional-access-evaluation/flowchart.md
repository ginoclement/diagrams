---
title: "Conditional Access Evaluation — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Conditional Access Evaluation — Decision Flowchart

Signal-by-signal evaluation. Block and deny paths terminate explicitly; remediable
controls loop back through an interrupt.

```mermaid
flowchart TD
    Start(["Token requested at /authorize"]) --> Auth{"Primary auth<br/>succeeded?"}
    Auth -->|No| DenyAuth(["Deny: authentication failed"])
    Auth -->|Yes| Match{"Any CA policy<br/>matches signals?"}
    Match -->|No| Issue(["Issue token - no policy applies"])
    Match -->|Yes| Legacy{"Legacy auth or<br/>blocked location?"}

    Legacy -->|Yes| DenyBlock(["Deny: blocked by policy"])
    Legacy -->|No| Risk{"Sign-in / user<br/>risk level?"}

    Risk -->|High| RiskCtl["Require MFA + secure<br/>password change"]
    Risk -->|"Low / medium"| DevReq{"Require compliant or<br/>hybrid-joined device?"}
    RiskCtl --> Remediate{"Remediation<br/>completed?"}
    Remediate -->|No| DenyRisk(["Deny: risk not remediated"])
    Remediate -->|Yes| DevReq

    DevReq -->|No| MfaReq{"Require MFA?"}
    DevReq -->|Yes| DevState{"Device compliant<br/>or hybrid-joined?"}
    DevState -->|No| DenyDev(["Deny: device not compliant"])
    DevState -->|Yes| MfaReq

    MfaReq -->|No| Grant{"Remaining grant<br/>controls met?"}
    MfaReq -->|Yes| MfaMet{"MFA already<br/>satisfied this session?"}
    MfaMet -->|Yes| Grant
    MfaMet -->|No| Challenge["Interrupt: MFA challenge"]
    Challenge --> MfaOK{"MFA proof<br/>valid?"}
    MfaOK -->|No| DenyMfa(["Deny: MFA failed"])
    MfaOK -->|Yes| Grant

    Grant -->|No| DenyGrant(["Deny: control unsatisfied"])
    Grant -->|Yes| Ok(["Issue token with session controls<br/>(sign-in frequency, CAE)"])
```

Notes

- Block controls are evaluated first and short-circuit everything else — a matched block
  policy always wins over any grant.
- The MFA "already satisfied" gate reflects the `amr` / `satisfied_by` claims so a live
  session is not re-challenged needlessly.
- Session controls (sign-in frequency, persistent browser, CAE) are stamped onto the
  token at the final issue step; CAE lets those tokens be revoked mid-session.
