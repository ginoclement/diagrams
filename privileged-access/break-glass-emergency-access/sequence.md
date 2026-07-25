# Break-Glass Emergency Access — Sequence Diagram

Happy path first (M-of-N custodian control, loud alerting, emergency use, mandatory reseal),
then alternates: single-custodian override, directory-unavailable path, and an
unauthorized attempt that triggers containment.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Cust as Custodian
    participant PAM as PAM (vault)
    participant SIEM
    participant Dir as Directory

    User->>PAM: Declare emergency, request break-glass account
    PAM->>SIEM: HIGH-severity alert - break-glass invocation started
    SIEM->>SIEM: Page security + leadership (non-suppressible)
    PAM->>PAM: Require multi-person control (M-of-N)

    par Custodian co-authorization
        PAM->>Cust: Request co-authorization (incident ref)
        Cust-->>PAM: Approve and supply credential part
    end

    PAM->>PAM: Reassemble sealed credential<br/>(quorum of parts met)
    PAM->>Dir: Sign in as emergency account
    Dir-->>PAM: Emergency session established
    PAM-->>User: Emergency access granted (fully recorded)
    User->>Dir: Perform emergency remediation

    User->>PAM: End emergency access
    PAM->>SIEM: Alert - break-glass session ended
    PAM->>Dir: Rotate emergency account secret
    Dir-->>PAM: Secret rotated
    PAM->>PAM: Re-split, re-seal credential;<br/>open mandatory post-use review
    PAM-->>User: Resealed - review ticket assigned

    alt Single-custodian override (true lone responder)
        User->>PAM: Invoke documented solo override
        PAM->>SIEM: CRITICAL alert - solo break-glass, retroactive review required
        PAM->>Dir: Sign in as emergency account
    end

    alt Directory / normal login path unavailable
        Note over User,Dir: Primary IdP down - use cloud-only /<br/>out-of-band emergency account not dependent on it
        PAM->>Dir: Authenticate via independent emergency path
    end

    alt Unauthorized attempt (no matching incident)
        PAM->>SIEM: Invocation with no incident record
        SIEM->>SIEM: Treat as attack - containment, not access
        PAM-->>User: Denied - invocation blocked and escalated
    end
```

Notes

- Alerting fires at the *start* of invocation, before access is granted, so responders
  and abusers alike cannot open the seal quietly.
- The `par` block is the multi-person control: the quorum of custodian parts is what
  reassembles the credential; one part alone never does.
- Reseal + rotate is mandatory and gated by review; until it completes the account stays
  quarantined and cannot be invoked again.
