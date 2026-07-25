# Group Membership Sync — Decision Flowchart

Per-member decision logic from source group to downstream entitlement, with explicit error
and quarantine terminals.

```mermaid
flowchart TD
    START(["Sync run begins"]) --> READ["Read in-scope source groups"]
    READ --> CYCLE{"Nested groups<br/>form a cycle?"}
    CYCLE -->|"yes"| BREAK["Break at depth guard, flag group"]
    CYCLE -->|"no"| FLAT["Flatten to effective members"]
    BREAK --> FLAT
    FLAT --> MAP{"Source group mapped to<br/>an existing target?"}
    MAP -->|"no"| ERMap(["Error: target group / mapping missing,<br/>skip"])
    MAP -->|"yes"| DIFF["Diff effective vs current app membership"]

    DIFF --> PER{"Per member:<br/>add, remove, or same?"}
    PER -->|"same"| NOOP(["No-op"])
    PER -->|"add"| PROV{"Member account<br/>provisioned in app?"}
    PROV -->|"no"| DEFER(["Defer grant until account exists"])
    PROV -->|"yes"| GRANT["Assign entitlement"]
    GRANT --> GOK{"Grant succeeded?"}
    GOK -->|"no"| ERGrant(["Error: grant failed, retry / alert"])
    GOK -->|"yes"| DONEg(["Member entitled"])

    PER -->|"remove"| CONF{"Removal conflicts with<br/>out-of-band grant?"}
    CONF -->|"ambiguous"| QUAR(["Quarantine for review"])
    CONF -->|"source authoritative"| REVOKE["Deprovision entitlement"]
    REVOKE --> ROK{"Revoke succeeded?"}
    ROK -->|"no"| ERRevoke(["Error: revoke failed,<br/>standing access, alert"])
    ROK -->|"yes"| DONEr(["Access removed"])
```

Notes

- Cycle detection and the depth guard run before flattening so a circular or pathologically
  nested group cannot hang the run or explode the effective set.
- Adds are held (`DEFER`) when the member has no account yet, avoiding orphaned grants;
  removes drive a real deprovision so leaving a group actually revokes access.
- A failed revoke is escalated as standing-access risk rather than dropped, and out-of-band
  conflicts resolve to the authoritative source or quarantine when ambiguous.
