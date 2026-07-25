# Group Membership Sync — Sequence Diagram

Happy path first (flatten, diff, grant and revoke), then circular nesting, member not yet
provisioned, out-of-band conflict, and a missing target group.

```mermaid
sequenceDiagram
    autonumber
    participant Dir as Directory (source)
    participant Sync as Sync engine
    participant App as Downstream app

    Sync->>Dir: Read in-scope groups + memberships
    Dir-->>Sync: Group definitions (some nested)
    Sync->>Sync: Flatten nested groups to effective members<br/>(cycle detection, depth guard)
    Sync->>Sync: Map source groups to target entitlements
    Sync->>App: Read current target membership
    App-->>Sync: Current members
    Sync->>Sync: Compute delta (adds, removes)

    Sync->>App: Grant added members (assign entitlement)
    App-->>Sync: Granted
    Sync->>App: Revoke removed members (deprovision)
    App-->>Sync: Revoked
    Sync->>Sync: Write audit log

    alt Circular nesting detected
        Sync->>Sync: Break cycle at depth guard, flag group,<br/>continue with partial effective set
    end

    alt Member account not yet provisioned in app
        Sync->>App: Attempt grant
        App-->>Sync: User not found
        Sync->>Sync: Defer grant until account exists
    end

    alt Out-of-band change (conflict)
        Sync->>App: Read shows manual grant not in source
        Sync->>Sync: Source authoritative: schedule reconcile revoke<br/>(or quarantine if ambiguous)
    end

    alt Target group / mapping missing
        Sync->>App: Resolve mapped target group
        App-->>Sync: Group not found
        Sync->>Sync: Skip mapping, report error
    end
```

Notes

- Flattening happens before the diff, so a user who is a member only through a child group is
  included in the effective set the app receives.
- Removes are applied as real revokes (deprovision on removal), so dropping a user from the
  source group actually strips the downstream entitlement.
- Conflicts where the target was changed out of band resolve in favor of the authoritative
  source, with genuinely ambiguous cases quarantined rather than blindly overwritten.
