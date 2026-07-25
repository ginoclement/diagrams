---
title: "Access Review & Certification — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Access Review & Certification — Sequence Diagram

Happy path first (campaign generated, reviewer decides per item, revocations remediated),
then bulk-approve, delegated-review, and auto-revoke-on-no-response alternates.

```mermaid
sequenceDiagram
    autonumber
    participant IGA as IGA Engine
    actor Reviewer
    participant IdP as IdP / Directory
    participant App as Downstream App

    %% --- Happy path ---
    IGA->>IGA: Generate campaign<br/>(scope users + entitlements, set deadline)
    IGA->>Reviewer: Assign review items<br/>(user, entitlement, last-used, risk)
    Reviewer->>Reviewer: Review each item in context

    loop Per review item
        alt Access still needed
            Reviewer-->>IGA: Certify (keep)
            IGA->>IGA: Record signed, timestamped approval
        else Access no longer justified
            Reviewer-->>IGA: Revoke
            IGA->>IGA: Queue remediation item
        end
    end

    IGA->>IdP: Remove revoked group memberships (PATCH /Groups)
    IdP-->>IGA: 200 OK
    IGA->>App: Deprovision revoked entitlements (SCIM)
    App-->>IGA: 200 OK
    IGA-->>Reviewer: Campaign complete, decisions archived for audit

    %% --- Alternates ---
    alt Bulk approve
        Reviewer-->>IGA: Certify N low-risk items in one action
        Note over IGA,Reviewer: Faster, but rubber-stamping<br/>weakens the control - risky items excluded from bulk
    else Delegated review
        Reviewer->>IGA: Reassign items to a delegate
        IGA->>Reviewer: Notify delegate of assigned items
        Note over IGA,Reviewer: Delegate now certifies / revokes those items
    end

    opt Deadline reached with undecided items
        IGA->>IGA: Apply no-response policy = auto-revoke
        IGA->>IdP: Remove memberships for undecided items
        IGA->>App: Deprovision the corresponding entitlements
        Note over IGA,App: Secure default - undecided access is removed,<br/>not silently retained
    end
```

Notes

- Each decision is stored with reviewer identity and timestamp — that record *is* the audit
  evidence the campaign exists to produce.
- Auto-revoke on no-response is deliberate: the safe default for an unattested grant is to
  remove it, shifting the burden onto keeping access rather than losing it.

Related: [README](./README.md) | [Swimlane](./swimlane.md) | [Flowchart](./flowchart.md)
