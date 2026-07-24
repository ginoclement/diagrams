# JML Orchestration — Sequence Diagram

High-level view: one HR event stream drives IGA, which routes to the joiner, mover, or
leaver flow. Happy path shows the common shape; alternates cover out-of-order events,
rehire, and the reconciliation sweep. Each branch links to its detailed diagram.

```mermaid
sequenceDiagram
    autonumber
    participant HR as HR / Source of Truth
    participant IGA as IGA Engine
    participant IdP as IdP / Directory
    participant App as Downstream App
    actor Reviewer

    %% --- Common shape ---
    HR->>IGA: Lifecycle event (worker_id, change type, attributes)
    IGA->>IGA: Classify event -> joiner / mover / leaver
    IGA->>IGA: Re-evaluate target access from attributes + policy

    alt Joiner (new worker)
        Note over IGA,App: See joiner-onboarding
        IGA->>IdP: Create + enable account
        IGA->>App: Provision birthright + RBAC (SCIM)
    else Mover (attribute change)
        Note over IGA,App: See mover-role-change
        IGA->>IGA: Diff current vs target, run SoD
        opt New grants need sign-off
            IGA->>Reviewer: Approval request
            Reviewer-->>IGA: Approve
        end
        IGA->>IdP: Add new + remove stale memberships
        IGA->>App: Provision adds, deprovision revokes
    else Leaver (termination)
        Note over IGA,App: See leaver-offboarding
        IGA->>IdP: Disable account, revoke sessions + tokens
        IGA->>App: Deprovision, then delete after retention
    end

    %% --- Periodic governance control ---
    opt Periodic access review
        Note over IGA,Reviewer: See access-review-certification
        IGA->>Reviewer: Certification campaign
        Reviewer-->>IGA: Certify / revoke decisions
        IGA->>App: Remediate revocations (SCIM)
    end

    %% --- Alternates ---
    alt Out-of-order events
        HR->>IGA: Leaver event arrives before a pending mover finishes
        IGA->>IGA: Reconcile to latest authoritative state<br/>(leaver wins - full teardown)
    else Rehire
        HR->>IGA: Joiner event matches a retained disabled identity
        IGA->>IdP: Re-enable existing account (not net-new)
    end

    opt Reconciliation sweep
        IGA->>IdP: Read actual accounts + memberships
        IGA->>App: Read actual entitlements
        IGA->>IGA: Compare target vs actual, remediate drift + orphans
    end
```

Notes

- Every transition is the same three beats — event, re-evaluation, provisioning — which is
  why a single IGA engine can own all of JML.
- The reconciliation sweep is the safety net: even if an event is missed or an app drifts,
  periodic target-vs-actual comparison converges the system back to policy.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
