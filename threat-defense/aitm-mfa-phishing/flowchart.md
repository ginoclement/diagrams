---
title: "AiTM MFA Phishing — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# AiTM MFA Phishing — Decision Flowchart

Where each control forces a **deny** (prevention) or **detect** terminal. The relayed MFA always
succeeds — so defense depends on origin binding and token binding, not on the second factor.

```mermaid
flowchart TD
    Start(["Victim opens proxy<br/>look-alike login"]) --> FactorQ{"Primary factor<br/>phishing-resistant?"}
    FactorQ -->|"FIDO2 / passkey"| OriginQ{"Assertion origin ==<br/>expected IdP origin?"}
    OriginQ -->|"No - proxy origin"| Deny1(["DENY: origin binding,<br/>relay fails - no session"])
    OriginQ -->|Yes| Legit(["Legitimate direct login<br/>(no proxy in path)"])

    FactorQ -->|"Password + OTP / push"| Relay["Proxy relays MFA,<br/>captures session cookie"]
    Relay --> BindQ{"Session token bound<br/>to client key?<br/>DPoP / mTLS / token binding"}
    BindQ -->|Yes| Deny2(["DENY: replay from other<br/>host lacks proof-of-possession"])
    BindQ -->|No| Replay["Attacker replays<br/>bearer cookie"]

    Replay --> RiskQ{"CAE / risk: new ASN,<br/>impossible travel?"}
    RiskQ -->|Yes| Detect1(["DETECT: revoke session,<br/>reauth, reset factors"])
    RiskQ -->|No| ActQ{"Anomalous post-login<br/>actions? inbox rules,<br/>new consent, MFA reg"}
    ActQ -->|Yes| Detect2(["DETECT: investigate,<br/>revoke session"])
    ActQ -->|No| Gap(["Residual risk: valid bearer<br/>session, plausible network<br/>- deploy passkeys, token<br/>binding, short lifetimes"])
```

Notes

- **Origin binding** (`OriginQ`) is the only control that stops AiTM before a session exists;
  everything to the right assumes a session cookie was already issued.
- **Token binding** (`BindQ`) neutralizes the stolen cookie by making it non-replayable off the
  victim's host — the second strongest control after passkeys.
- The `Gap` terminal is honest about residual risk: a bearer session replayed from a
  victim-like network with quiet behavior can evade risk scoring, which is why phishing-resistant
  auth and sender-constrained tokens are the durable fixes.
