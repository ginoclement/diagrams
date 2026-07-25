# Password Hash Sync — Sequence Diagram

Two phases: the background hash synchronization, then a cloud-only sign-in. Alternates cover
on-prem password change, on-prem outage, and MFA step-up.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Agent as Agent (Entra Connect)
    participant Dir as Directory (AD)
    participant IdP as IdP (Cloud)

    rect rgb(235,245,255)
    Note over Agent,IdP: Phase 1 - background hash synchronization (~every 2 min)
    Agent->>Dir: Read NT hash for changed accounts (MS-DRSR replication)
    Dir-->>Agent: Per-user NT hash (unsalted MD4)
    Agent->>Agent: Derive PBKDF2(HMAC-SHA256, NThash,<br/>per-user salt, 1000 iterations)
    Agent->>IdP: Upload derived hash + salt over TLS
    IdP->>IdP: Store derived hash against cloud user
    end

    rect rgb(235,255,235)
    Note over User,IdP: Phase 2 - sign-in (cloud-only, no on-prem call)
    User->>IdP: Sign in with corporate password
    IdP->>IdP: Apply same PBKDF2 to presented password, compare
    alt Hash matches
        IdP-->>User: Authenticated, issue tokens
    else Hash mismatch
        IdP-->>User: Sign-in failed - wrong password
    end
    end

    alt Password changed on-prem
        User->>Dir: Change password (Ctrl+Alt+Del / self-service)
        Agent->>Dir: Incremental password sync picks up new NT hash
        Agent->>IdP: Upload new derived hash (within ~2 min)
        Note over IdP: Old password no longer validates in cloud
    end

    alt On-prem directory offline at sign-in
        User->>IdP: Sign in with corporate password
        IdP->>IdP: Validate against stored hash (no AD dependency)
        IdP-->>User: Authenticated - resilience benefit of PHS
    end

    opt Conditional Access / MFA step-up
        IdP->>User: Additional factor required by policy
        User->>IdP: Complete MFA
        IdP-->>User: Tokens issued
    end
```

Notes

- Password sync is separate from and more frequent than object/attribute sync, so a changed
  password reaches the cloud within a couple of minutes.
- The uploaded value is a salted PBKDF2 over the NT hash — it cannot be reversed to the
  password nor replayed as the NT hash on-prem.
- Phase 2 never contacts the Directory: that independence is the resilience and simplicity
  advantage of PHS over federation and pass-through.
