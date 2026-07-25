# Privileged Session Recording & Monitoring — Sequence Diagram

Happy path first (proxied, fully recorded, clean session), then alternates:
forbidden-command flag, auto-termination, live operator kill, direct-connect bypass, and
recording-store failure.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Proxy as Session proxy
    participant Monitor
    participant Store
    participant Target

    User->>Proxy: Open privileged session (RDP / SSH / DB)
    Proxy->>Store: Start recording (allocate tamper-evident record)
    Store-->>Proxy: Recording active
    Proxy->>Target: Connect and inject brokered credential
    Target-->>Proxy: Session established
    Proxy-->>User: Connected (you are being recorded)

    loop Every command / screen update
        User->>Proxy: Keystrokes / command / screen action
        Proxy->>Store: Persist video + keystroke + command log
        Proxy->>Monitor: Stream command for real-time evaluation
        Monitor-->>Proxy: Allow (no policy hit)
        Proxy->>Target: Forward command
        Target-->>User: Command output (via proxy, recorded)
    end

    User->>Proxy: End session
    Proxy->>Store: Finalize and seal recording (hash chain)
    Proxy-->>User: Session closed, recording retained

    alt Forbidden command - flagged only
        Monitor-->>Proxy: Policy hit - risky command
        Proxy->>Monitor: Raise real-time alert (allow to continue)
    end

    alt Forbidden command - auto-terminate
        Monitor-->>Proxy: Blocked command / threshold exceeded
        Proxy->>Target: Kill session immediately
        Proxy->>Store: Seal recording, mark terminated-by-policy
        Proxy-->>User: Session terminated (policy violation)
    end

    alt Live operator termination
        Monitor->>Proxy: SOC analyst issues terminate
        Proxy->>Target: Kill session
        Proxy-->>User: Session terminated by operator
    end

    alt Direct-connect bypass attempt
        User->>Target: Connect directly, bypassing proxy
        Note over User,Target: Network policy blocks non-proxy privileged paths
        Target-->>User: Denied - no route except via proxy
    end

    alt Recording store unavailable
        Proxy->>Store: Start recording
        Store-->>Proxy: Error - cannot persist
        Proxy-->>User: Fail closed - session refused (no recording, no session)
    end
```

Notes

- Recording starts *before* the target connection is completed, so no privileged activity
  can occur before capture is live.
- The `loop` shows the inline decision point: every command is both persisted and
  evaluated, which is what makes real-time termination possible.
- The store-failure alternate defaults to fail-closed; a monitor-only deployment could
  instead continue degraded with a high-severity alert, a deliberate risk trade-off.
