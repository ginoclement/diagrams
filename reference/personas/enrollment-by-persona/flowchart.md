---
title: "Enrollment by Persona — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Enrollment by Persona — Decision Flowchart

Branch on how enrolment is initiated, then apply the trust check that persona requires before
a factor is registered.

```mermaid
flowchart TD
    Start(["Enrolment needed"]) --> Init{"Initiation model?"}

    Init -->|IT / MDM push| Managed{"Device managed<br/>and attested?"}
    Managed -->|No| MdmFirst["Enrol device in MDM,<br/>push certificate"] --> Managed
    Managed -->|Yes| WfReg["Register factor on managed device"]
    WfReg --> WfDone(["Workforce enrolment complete"])

    Init -->|self-service| Proof{"Proof of control<br/>verified? (email / phone)"}
    Proof -->|No| ProofFail(["Block: unverified, rate-limit"])
    Proof -->|Yes| CoActive["Account active, minimal factors"]
    CoActive --> AddF{"Add stronger factor<br/>now?"}
    AddF -->|Yes| CoReg["Register passkey / authenticator"] --> CoDone
    AddF -->|Later| CoDone(["Consumer enrolment complete<br/>(progressive)"])

    Init -->|invitation| Inv{"Invite valid?<br/>single-use, unexpired, audience-bound"}
    Inv -->|No| InvFail(["Deny: invalid or expired invite"])
    Inv -->|Yes| GVerify{"Light verification<br/>passes?"}
    GVerify -->|No| InvFail
    GVerify -->|Yes| GScope["Create minimal identity<br/>scoped to shared resource"]
    GScope --> GDone(["Guest enrolment complete (expiring)"])
```

Notes

- The initiation diamond is the fork: push (workforce), pull (consumer), or invite (guest).
- Workforce cannot complete until the device is managed and attested; that gate is what makes
  its factors trustworthy for later high-assurance auth.
- Consumer has an explicit "later" branch — progressive enrolment is a first-class outcome, not
  an incomplete one.

Related: [README](./README.md) | [Sequence](./sequence.md) | [Swimlane](./swimlane.md)
