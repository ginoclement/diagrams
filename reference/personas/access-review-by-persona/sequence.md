---
title: "Access Review by Persona — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Access Review by Persona — Sequence Diagram

The persona is resolved first, then each `alt` branch shows the cadence, approver, and default
decision for that persona. Branches reference the base certification flow rather than redrawing
it.

```mermaid
sequenceDiagram
    autonumber
    participant Campaign as IGA Campaign
    participant Source as HR / Contract source
    participant Reviewer as Reviewer
    actor Subject
    participant Fulfillment as Fulfillment / SCIM

    Note over Campaign,Source: Cadence and approver selected from persona

    alt Standard employee (periodic, manager)
        Campaign->>Source: Read employment status
        Campaign->>Reviewer: Assign to line manager<br/>(quarterly / annual)
        Reviewer->>Reviewer: Certify or revoke per entitlement
        Reviewer-->>Campaign: Decisions (default certify low-risk)
    else Contractor (engagement-bound, sponsor)
        Campaign->>Source: Read contract end date
        alt Past end date, no renewal
            Campaign->>Fulfillment: Auto-revoke on lapse
        else Within engagement
            Campaign->>Reviewer: Assign to sponsoring manager<br/>(short cadence)
            Reviewer-->>Campaign: Renew or revoke (deny on no-decision)
        end
    else Privileged (frequent, owner + security)
        Campaign->>Reviewer: Assign to resource owner AND security<br/>(monthly / continuous)
        Reviewer->>Reviewer: Check SoD, justification, last-used
        Reviewer-->>Campaign: Bias to revoke if not justified
    else Workload (owner, unused permissions)
        Campaign->>Reviewer: Assign to owning team
        Reviewer->>Reviewer: Review unused perms, stale keys
        Reviewer-->>Campaign: Trim permissions, rotate/retire creds
    end

    Campaign->>Fulfillment: Push revoke decisions
    Fulfillment-->>Subject: Access removed where revoked
    Campaign->>Campaign: Record evidence + justification
```

Notes

- The persona sets three things at once: **how often** the campaign runs, **who** attests, and
  **what happens on no-decision** (certify-lean for standard, revoke-lean for contractor and
  privileged).
- Contractor access can be revoked with **no reviewer step at all** when the contract end date
  has passed — the source of truth, not a human, drives it.
- Privileged is the only branch requiring **two approvers** (resource owner and security) and an
  explicit last-used/justification check.

Related: [README](./README.md) | [Swimlane](./swimlane.md) | [Flowchart](./flowchart.md)
