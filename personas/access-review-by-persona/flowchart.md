# Access Review by Persona — Decision Flowchart

Branch on principal type first, then on the cadence and approver decisions each path makes.
Terminal states are access retained or revoked.

```mermaid
flowchart TD
    Start(["Recertification due"]) --> Kind{"Principal type?"}

    Kind -->|standard employee| SCad{"Cadence reached?<br/>(quarterly / annual)"}
    SCad -->|No| Wait1(["Wait for next cycle"])
    SCad -->|Yes| SMgr{"Line manager<br/>certifies?"}
    SMgr -->|Yes| SKeep(["Access retained"])
    SMgr -->|No / no decision| SRev(["Revoke entitlement"])

    Kind -->|contractor| CEnd{"Contract end<br/>date passed?"}
    CEnd -->|Yes| CAuto(["Auto-revoke on lapse"])
    CEnd -->|No| CSpon{"Sponsor renews<br/>before deadline?"}
    CSpon -->|Yes| CKeep(["Access renewed to next checkpoint"])
    CSpon -->|No / no decision| CAuto

    Kind -->|privileged| VDual{"Owner AND security<br/>certify + SoD ok?"}
    VDual -->|No| VRev(["Revoke: standing privilege removed"])
    VDual -->|Yes justified, still used| VKeep(["Access retained (short window)"])
    VDual -->|Yes but unused| VRev

    Kind -->|workload| WUnused{"Permissions used<br/>recently?"}
    WUnused -->|No| WTrim(["Trim perms, rotate/retire creds"])
    WUnused -->|Yes| WKeep(["Retain, note last-used"])
```

Notes

- The default on **no decision** flips by persona: standard employees lean to revoke the
  specific entitlement, contractors auto-revoke on lapse, privileged revokes standing rights —
  none silently renew.
- Contractor access has a source-driven hard stop (`CEnd`) that fires with no human in the
  loop; the sponsor review only matters *within* the engagement window.
- Privileged and workload paths both gate on **last-used**: unused high-value access is revoked
  even when nominally justified, shrinking the standing-privilege surface.

Related: [README](README.md) | [Sequence](sequence.md) | [Swimlane](swimlane.md)
