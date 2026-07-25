---
title: "MFA Fatigue and Number Matching — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# MFA Fatigue and Number Matching — Swimlane Diagram

One lane per actor. The key asymmetry is visual: the number is generated in the IdP lane
and shown to whoever *started* the sign-in, while the prompt lands in the Authenticator
lane on the victim's phone.

```mermaid
flowchart TD
    subgraph User
        U1["Start legitimate sign-in"]
        U2["Read number on own screen"]
        U3["Enter matching number"]
        U4(["Signed in"])
        U5["Deny / ignore unexpected prompt"]
        U6(["Attack blocked"])
    end

    subgraph Attacker
        A1["Sign-in with stolen password"]
        A2["Sees number on attacker screen only"]
        A3(["No approval obtained"])
    end

    subgraph IdP
        I1["Verify password"]
        I2["Generate + display number"]
        I3["Send push (number + context)"]
        I4{"Entered number<br/>matches?"}
        I5{"Repeated failures<br/>over limit?"}
        I6["Issue tokens"]
    end

    subgraph Authenticator
        N1["Prompt: enter number + show context"]
        N2["Return entered value / denial"]
    end

    U1 --> I1 --> I2 --> U2 --> N1
    I2 --> I3 --> N1
    N1 --> U3 --> N2 --> I4
    I4 -->|"Yes"| I6 --> U4
    I4 -->|"No"| I5
    I5 -->|"Yes"| Lock(["Locked out, alert"])
    I5 -->|"No"| N1

    A1 --> I1
    A1 --> A2
    I3 --> N1
    N1 --> U5 --> N2
    N2 --> A3
    U5 --> U6
```

Notes

- The number flows `I2 --> U2` to the legitimate initiator but `I2 --> A2` to the attacker,
  the victim in the Authenticator lane never receives it, so they cannot approve an attack.
- `I4` (match) and `I5` (rate-limit) are the two gates, a wrong or brute-forced number lands
  in `Lock` rather than granting.
- The attacker lane always terminates in `A3` with no approval because the approval path
  requires a value only the initiator can see.
