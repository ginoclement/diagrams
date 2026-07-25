---
title: "MFA Fatigue and Number Matching — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# MFA Fatigue and Number Matching — Decision Flowchart

The approval decision under number matching, showing why a push-bombing attacker cannot
approve and how repeated failures end in lockout.

```mermaid
flowchart TD
    S(["Sign-in attempt with valid password"]) --> Init{"Who initiated<br/>this sign-in?"}
    Init -->|"Legitimate user"| SeeNum["User sees number<br/>on own sign-in screen"]
    Init -->|"Attacker (stolen password)"| AttNum["Number shown on<br/>attacker screen only"]

    AttNum --> VictimPush["Victim phone gets push<br/>(number not visible to victim)"]
    VictimPush --> VictimAct{"Victim action?"}
    VictimAct -->|"Deny / ignore"| BlockA(["Attack blocked: no approval, alert"])
    VictimAct -->|"Guess a number"| Match

    SeeNum --> Enter["User enters number in app"]
    Enter --> Match{"Entered number<br/>matches expected?"}

    Match -->|Yes| Grant(["Access granted"])
    Match -->|No| Limit{"Failures over<br/>rate limit?"}
    Limit -->|No| Retry["Re-prompt"] --> Match
    Limit -->|Yes| Lock(["Deny: locked out, alert raised"])

    Legacy["Plain approve/deny push<br/>(no number)"] -.->|"discouraged"| Fatigue(["Risk: fatigued user taps Approve<br/>on attacker prompt"])
```

Notes

- The root split `Init` is the whole defence: the number is bound to the **initiator**, so
  the attacker path (`AttNum --> VictimPush`) can never surface a number the victim could
  correctly enter.
- A brute-force guess collapses into the same `Match`/`Limit` loop, the small number space is
  protected by rate-limiting and `Lock`, not by secrecy alone.
- The dashed `Legacy` branch shows the discouraged one-tap flow whose only gate is a human
  reflex, which is precisely the `Fatigue` failure number matching eliminates.
