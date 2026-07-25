---
title: "Privileged Session Recording and Monitoring — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Privileged Session Recording and Monitoring — Swimlane Diagram

One lane per actor. The Proxy lane is the inline broker: everything the User does reaches
the Target only after passing through it, and every action is mirrored to the Recorder.

```mermaid
flowchart TD
    subgraph User
        U1["Request session to target"]
        U2["Issue commands"]
        U3(["Session closed"])
        U4(["Session terminated / blocked"])
    end

    subgraph Proxy["Session proxy"]
        P1["Authorize connection"]
        P2["Inject vaulted credential"]
        P3["Start recording"]
        P4["Forward allowed command"]
        P5["Seal recording on exit"]
    end

    subgraph Policy["Policy engine"]
        Y1["Check connection policy"]
        Y2{"Command allowed?"}
    end

    subgraph Recorder
        R1["Capture screen + keystroke / command log"]
        R2["Store sealed, tamper-evident recording"]
    end

    subgraph Target
        T1["Execute forwarded command"]
    end

    subgraph Reviewer
        V1["Watch live stream"]
        V2["Force terminate"]
    end

    U1 --> P1 --> Y1
    Y1 -->|"Denied"| U4
    Y1 -->|"Allowed"| P2 --> P3 --> R1
    P3 --> U2 --> P4
    P4 --> Y2
    Y2 -->|"No - block or terminate"| U4
    Y2 -->|"Yes"| T1 --> R1
    R1 --> V1 --> V2 --> P5
    U2 --> P5 --> R2 --> U3
    Y2 -->|"No - hard rule"| P5
```

Notes

- `Y1` (connection) and `Y2` (per-command) are the two gates, a deny at either lands in the
  terminal `U4` without the command reaching the Target.
- The Recorder lane receives both the User's keystrokes and the Target's output via the
  Proxy, so the sealed artifact `R2` is a complete two-sided transcript.
- The Reviewer lane taps the live stream `R1` and can drive `V2 --> P5` to terminate,
  modelling live four-eyes intervention rather than after-the-fact review only.
