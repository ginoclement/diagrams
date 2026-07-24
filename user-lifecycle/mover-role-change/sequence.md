# Mover — Role Change Sequence Diagram

Happy path first (attribute change, re-evaluate, add new + revoke stale with approval),
then lateral-move retention, grace-window dual access, and SoD-violation alternates.

```mermaid
sequenceDiagram
    autonumber
    participant HR as HR / Source of Truth
    participant IGA as IGA Engine
    participant IdP as IdP / Directory
    participant App as Downstream App
    actor Manager

    %% --- Happy path ---
    HR->>IGA: Attribute change event<br/>(dept Finance -> Engineering, new manager)
    IGA->>IGA: Recompute target entitlements for new role
    IGA->>IGA: Diff current vs target -><br/>adds = new role, revokes = stale Finance access
    IGA->>IGA: Run SoD check on the proposed add set

    alt No SoD conflict
        IGA->>Manager: Approval request for new grants + revokes
        Manager-->>IGA: Approve
        par Apply changes
            IGA->>IdP: Add Engineering groups (PATCH /Groups)
            IdP-->>IGA: 200 OK
            IGA->>IdP: Remove stale Finance groups (PATCH /Groups)
            IdP-->>IGA: 200 OK
        end
        IGA->>App: Provision new entitlements, deprovision stale ones
        App-->>IGA: 200 OK
        IGA-->>Manager: Change complete, access aligned to new role
    end

    %% --- Alternates ---
    alt Lateral move keeps some access
        IGA->>IGA: Overlapping entitlements common to both roles -> retain
        Note over IGA,IdP: Only the non-overlapping delta is added or revoked
    else Temporary dual access grace window
        IGA->>IGA: Mark stale entitlements with expiry = now + grace period
        IGA->>IdP: Keep old groups, schedule timed removal
        Note over IGA,App: Worker retains handover access,<br/>auto-revoked when the grace window ends
        IGA->>IdP: On expiry, remove old groups (PATCH /Groups)
    end

    opt SoD violation on a new grant
        IGA->>IGA: New entitlement conflicts with a retained one<br/>(toxic combination)
        alt Hard block
            IGA-->>Manager: Grant denied - SoD policy violation
        else Exception review
            IGA->>Manager: SoD exception approval request<br/>(risk acknowledged, compensating control?)
            alt Exception approved
                Manager-->>IGA: Approve with mitigating control
                IGA->>App: Grant with SoD exception logged
            else Exception rejected
                Manager-->>IGA: Reject
                IGA->>IGA: Drop conflicting grant, keep the rest
            end
        end
    end
```

Notes

- The revoke half of the diff is the whole point — omitting it is exactly how privilege
  creep accumulates across a career of moves.
- SoD is evaluated against the *post-change* held set (adds plus retained), not just the
  adds, so a conflict with kept access is caught.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
