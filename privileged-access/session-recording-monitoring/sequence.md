# Privileged Session Recording and Monitoring — Sequence Diagram

Happy path first (brokered session, per-command policy, sealed recording), then the
in-line block, mid-stream termination, and idle-timeout alternates, plus optional live
four-eyes monitoring.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Proxy as Session proxy
    participant Policy as Policy engine
    participant Rec as Recorder
    participant Tgt as Target
    participant Rev as Reviewer

    User->>Proxy: Request session to target (already authenticated to proxy)
    Proxy->>Policy: Authorize connection (user, target, time window)
    Policy-->>Proxy: Allowed
    Proxy->>Tgt: Open session with injected vaulted credential
    Tgt-->>Proxy: Session established
    Proxy->>Rec: Start recording (screen capture + keystroke / command log)
    Proxy-->>User: Connected (credential never exposed)

    loop Per command / keystroke
        User->>Proxy: Issue command
        Proxy->>Rec: Append to command log
        Proxy->>Policy: Evaluate command against rules
        Policy-->>Proxy: Allow
        Proxy->>Tgt: Forward command
        Tgt-->>User: Output (via proxy, also recorded)
    end

    User->>Proxy: End session
    Proxy->>Rec: Seal recording (integrity hash, index)
    Proxy-->>User: Session closed

    alt Prohibited command - block in-line
        Policy-->>Proxy: Deny this command
        Proxy-->>User: Command blocked (session continues)
        Proxy->>Rec: Log blocked-command event
    end

    alt Hard-rule violation or reviewer kill - terminate
        Policy-->>Proxy: Terminate session
        Proxy->>Tgt: Tear down connection
        Proxy->>Rec: Mark session terminated, seal partial recording
        Proxy->>Rev: Raise alert
        Proxy-->>User: Session terminated
    end

    alt Idle or max-duration timeout
        Proxy->>Tgt: Close connection (no activity / limit reached)
        Proxy->>Rec: Seal recording
        Proxy-->>User: Session ended - timeout
    end

    opt Live four-eyes monitoring
        Rec-->>Rev: Stream live session
        Rev->>Proxy: Intervene / force terminate
    end
```

Notes

- The operator authenticates to the **proxy**, not the target, so the vaulted credential is
  injected server-side and never leaves the proxy — that is what makes shared target
  accounts attributable.
- The per-command loop is the enforcement heart, every keystroke is logged **before** the
  policy verdict, so even a blocked or terminated action is captured as evidence.
- Sealing on every exit path (normal, terminated, timeout) means a partial session is still
  a tamper-evident record, not a gap.
