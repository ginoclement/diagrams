---
title: "Joiner — Onboarding Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Joiner — Onboarding Sequence Diagram

Happy path first (standard full-time hire, birthright auto-granted), then pre-hire,
contingent worker, provisioning-failure retry, and privileged-birthright approval
alternates.

```mermaid
sequenceDiagram
    autonumber
    participant HR as HR / Source of Truth
    participant IGA as IGA Engine
    participant IdP as IdP / Directory
    participant App as Downstream App
    actor Manager
    actor Worker

    %% --- Happy path ---
    HR->>IGA: New worker event<br/>(worker_id, dept, job code, start date, manager)
    IGA->>IGA: Create authoritative identity,<br/>match uniqueness (no existing person)
    IGA->>IGA: Compute birthright + RBAC entitlements<br/>from attributes
    IGA->>IdP: Create account (SCIM POST /Users, active=false until start)
    IdP-->>IGA: 201 Created (userName, id)
    IGA->>IdP: Add to birthright groups (PATCH /Groups)
    IdP-->>IGA: 200 OK

    par Provision downstream apps
        IGA->>App: SCIM POST /Users + group membership
        App-->>IGA: 201 Created
    end

    Note over IGA,IdP: On start date, activate account (active=true)
    IGA->>IdP: Enable account, trigger credential setup
    IdP-->>Worker: Welcome email + activation / enrollment link
    Worker->>IdP: Set password, enroll MFA
    IdP-->>Worker: Account active - day-one access ready

    %% --- Alternates ---
    alt Pre-hire / early start
        HR->>IGA: Worker event with future start date
        IGA->>IdP: Create staged account (active=false)
        Note over IGA,IdP: Limited birthright (training, email) only,<br/>full access released on start date
    else Contingent worker
        HR->>IGA: Contractor event (worker_type=contingent, end date, sponsor)
        IGA->>IGA: Apply contingent birthright profile<br/>(narrower set, hard expiry = end date)
        IGA->>IdP: Create account with scheduled deactivation
    end

    opt Downstream provisioning failure + retry
        IGA->>App: SCIM POST /Users
        App-->>IGA: 503 Service Unavailable
        IGA->>IGA: Queue task, retry with exponential backoff
        alt Recovers within retry budget
            IGA->>App: Retry SCIM POST /Users
            App-->>IGA: 201 Created
        else Still failing
            IGA->>Manager: Raise remediation task<br/>(manual provisioning required)
        end
    end

    opt Privileged birthright needs approval
        IGA->>Manager: Approval request for sensitive baseline entitlement
        alt Approved
            Manager-->>IGA: Approve
            IGA->>App: Grant privileged entitlement
        else Rejected or timed out
            Manager-->>IGA: Reject
            IGA->>IGA: Skip grant, log decision
        end
    end
```

Notes

- The account is created **before** the start date but kept inactive; activation and
  credential issuance are gated on the HR start date.
- Provisioning is idempotent — retries must not create duplicate accounts, which is why
  IGA matches uniqueness up front.

Related: [README](README.md) | [Swimlane](swimlane.md) | [Flowchart](flowchart.md)
