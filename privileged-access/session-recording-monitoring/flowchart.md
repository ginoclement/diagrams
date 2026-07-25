# Privileged Session Recording and Monitoring — Decision Flowchart

The gates between an operator and a target, and the per-command loop that can block or
terminate a live session. Recording availability is itself a gate — no recorder, no
session.

```mermaid
flowchart TD
    S(["Operator requests privileged session"]) --> Rec{"Recorder + policy<br/>engine available?"}
    Rec -->|No| DenyRec(["Deny: cannot record - fail closed"])
    Rec -->|Yes| Conn{"Connection authorized?<br/>(user, target, window)"}
    Conn -->|No| DenyConn(["Deny: not authorized for target"])
    Conn -->|Yes| Inject["Inject vaulted credential<br/>open + record session"]

    Inject --> Cmd["Operator issues command"]
    Cmd --> Log["Append to keystroke / command log"]
    Log --> Eval{"Command permitted<br/>by policy?"}

    Eval -->|"Blocked (soft rule)"| Block["Reject command<br/>session continues"]
    Block --> More{"More activity?"}
    Eval -->|"Violation (hard rule)"| Term(["Terminate: seal partial<br/>recording, raise alert"])
    Eval -->|Yes| Fwd["Forward to target<br/>record output"]
    Fwd --> More

    More -->|"Idle / max-duration exceeded"| Timeout(["End: timeout, seal recording"])
    More -->|"Reviewer forces kill"| Term
    More -->|"Yes - continue"| Cmd
    More -->|"Operator ends session"| Done(["End: seal + index recording"])
```

Notes

- The `Rec` gate encodes fail-closed recording: if the session cannot be captured it is
  never opened, so there is no such thing as an unrecorded privileged session.
- Soft-rule matches (`Block`) reject a single command but keep the session alive, while
  hard-rule matches and reviewer kills route to the same `Term` terminal that seals a
  partial recording and alerts.
- Every exit — `Term`, `Timeout`, `Done` — seals the recording, so no path leaves an
  unsealed or missing audit trail.
