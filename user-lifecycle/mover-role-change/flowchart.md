# Mover — Role Change Decision Flowchart

Grant/revoke decision logic centered on the diff and the SoD gate, with explicit terminals
for SoD denial and rejected approvals.

```mermaid
flowchart TD
    S([Attribute change event]) --> A["Recompute target entitlement set<br/>for the new role"]
    A --> B["Diff current vs target"]
    B --> C{"Entitlement in both<br/>old and new role?"}
    C -->|yes, overlap| D["Retain (no change)"]
    C -->|only in new role| E["Candidate ADD"]
    C -->|only in old role| F["Candidate REVOKE"]

    E --> G{"SoD conflict with<br/>post-change held set?"}
    G -->|yes| H{"Exception approved<br/>with compensating control?"}
    H -->|no| X([Grant DENIED -<br/>SoD policy violation])
    H -->|yes| I["Approved add (exception logged)"]
    G -->|no| I

    F --> J{"Move type needs<br/>handover access?"}
    J -->|no| K["Immediate revoke"]
    J -->|yes| L["Time-boxed grace window,<br/>auto-revoke on expiry"]

    I --> M{"Manager approves<br/>net change?"}
    K --> M
    L --> M
    D --> M
    M -->|no| Y([Change rejected -<br/>access unchanged])
    M -->|yes| N["Apply adds + revokes via SCIM"]
    N --> OK([Access aligned to new role])
```

Notes

- Overlapping entitlements are retained rather than revoked-then-re-added, which avoids a
  needless access gap during the move.
- The SoD check runs against the *held* set after the change, so a conflict with retained
  access is caught, not just conflicts among the new grants.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
