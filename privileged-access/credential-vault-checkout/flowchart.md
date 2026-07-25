# Credential Vault Check-Out / Check-In — Decision Flowchart

Every gate between "admin wants the credential" and "credential rotated", with explicit
deny and error terminals.

```mermaid
flowchart TD
    S(["Admin requests check-out"]) --> Auth{"Strong auth to<br/>vault succeeds?"}
    Auth -->|No| DenyAuth(["Deny: authentication failed"])
    Auth -->|Yes| Ent{"Entitled to this<br/>account / target?"}
    Ent -->|No| DenyEnt(["Deny: not entitled"])
    Ent -->|Yes| Appr{"Approval<br/>required?"}

    Appr -->|Yes| AwaitAppr{"Approved within<br/>window?"}
    AwaitAppr -->|No| DenyAppr(["Deny: not approved / expired"])
    AwaitAppr -->|Yes| Lock
    Appr -->|No| Lock{"Account available<br/>(exclusive lock free)?"}

    Lock -->|No| DenyLock(["Deny: in use - queue or retry"])
    Lock -->|Yes| Model{"Brokered or<br/>reveal?"}

    Model -->|Brokered| Broker["Inject secret into<br/>recorded session,<br/>secret never shown"]
    Model -->|Reveal| Reveal["Display secret for<br/>bounded window"]

    Broker --> Use["Admin performs work"]
    Reveal --> Use
    Use --> End{"Check-in, or<br/>lease TTL expired?"}
    End -->|Still active| Use
    End -->|Checked in / expired| Close["Close session,<br/>release lock"]

    Close --> Rotate{"Rotate credential<br/>on target?"}
    Rotate -->|Success| Done(["Checked in: new secret<br/>vaulted, audit written"])
    Rotate -->|Failure| Quar(["Error: quarantine account,<br/>alert, do not re-pool old value"])
```

Notes

- The approval and lock gates are independent: an approved request can still be denied at
  the lock if another admin holds the account.
- Both the brokered and reveal branches converge on the same mandatory rotation gate —
  reveal simply makes rotation non-negotiable because a human saw the value.
- Rotation failure terminates in an error state, not back at "available"; failing closed
  is what prevents a stale, known password from being handed out again.
