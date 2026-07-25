---
title: "Device Code Phishing — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
rfc: "RFC 8628"
---

# Device Code Phishing — Decision Flowchart

Where each control forces a **deny** (prevention) or **detect** terminal. The verification page
and login are always legitimate — so defense depends on policy, code expiry, and approval
context, not on spotting a fake site.

```mermaid
flowchart TD
    Start(["Attacker starts device flow,<br/>sends user_code to victim"]) --> ExpQ{"Victim enters code<br/>before it expires?"}
    ExpQ -->|"No - short lifetime"| Deny1(["DENY: code expired,<br/>attacker must re-initiate"])
    ExpQ -->|Yes| Auth["Victim authenticates + MFA<br/>at real IdP"]

    Auth --> CtxQ{"Approval screen understood?<br/>did you start this?"}
    CtxQ -->|"Victim cancels"| Deny2(["DENY: unexpected prompt<br/>refused"])
    CtxQ -->|"Victim approves"| CAQ{"Conditional access allows<br/>the polling client?<br/>managed device / trusted net"}
    CAQ -->|No| Deny3(["DENY: device grant<br/>blocked off-policy"])
    CAQ -->|Yes| Tok["IdP issues tokens<br/>to attacker's client"]

    Tok --> LocQ{"Approval location ==<br/>later token-use location?"}
    LocQ -->|No| Detect1(["DETECT: revoke tokens,<br/>force reauth, notify user"])
    LocQ -->|Yes| BehQ{"Device-grant use anomalous?<br/>high-value account, app that<br/>never uses device flow"}
    BehQ -->|Yes| Detect2(["DETECT: investigate,<br/>revoke session"])
    BehQ -->|No| Gap(["Residual risk: valid tokens,<br/>plausible location<br/>- restrict grant, short<br/>token lifetimes, CAE"])
```

Notes

- The strongest prevention is **not offering the device grant where it is not needed**
  (`CAQ`) plus **short `user_code` lifetimes** (`ExpQ`) — both shrink or close the window before
  detection is even required.
- A clear, verified **approval context** (`CtxQ`) turns the victim into a control: an informed
  user cancels an unsolicited code.
- The `Gap` terminal is honest about residual risk: if the attacker polls from a location similar
  to the victim's and uses a normal app, behavioral detection may miss it — hence continuous
  access evaluation and short token lifetimes to limit exposure.
