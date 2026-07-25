---
title: "Environment Protection and Approvals — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Environment Protection and Approvals — Sequence Diagram

Happy path first: build succeeds, the deploy job targets a protected environment,
the run pauses for a required reviewer, the wait timer elapses, scoped secrets are
released, and the deploy proceeds. Then the alternates: rejection, timeout,
disallowed branch, self-approval blocked, and a break-glass override.

```mermaid
sequenceDiagram
    autonumber
    actor Author
    participant Pipe as Pipeline
    participant Env as Environment
    participant Rev as Reviewer
    participant Tgt as Deploy target

    Author->>Pipe: Trigger run (push / merge / manual dispatch)
    Pipe->>Pipe: Build and test job succeeds
    Pipe->>Env: Deploy job targets environment "production"

    Env->>Env: Check deployment branch policy (ref allowed?)
    alt Ref allowed
        Env->>Env: Pause run, create pending deployment<br/>secrets NOT yet released
        Env-->>Rev: Request approval (notify required reviewers)

        alt Reviewer approves (distinct from Author)
            Rev->>Env: Approve deployment
            Env->>Env: Separation of duties check<br/>(approver != Author) passes
            opt Wait timer configured
                Env->>Env: Hold for wait timer (cool-off, e.g. 30 min)
            end
            Env->>Pipe: Release environment-scoped secrets, resume job
            Pipe->>Tgt: Deploy artifact
            Tgt-->>Pipe: Deploy succeeded
            Pipe-->>Author: Run succeeded, production updated
        else Reviewer rejects
            Rev->>Env: Reject deployment
            Env->>Pipe: Cancel deploy job, no secrets released
            Pipe-->>Author: Run cancelled, deployment rejected
        else No approval before timeout
            Env->>Env: Pending deployment expires (wait window elapsed)
            Env->>Pipe: Cancel deploy job, no secrets released
            Pipe-->>Author: Run cancelled, approval timed out
        end

    else Ref not permitted
        Env-->>Pipe: Block, branch/tag not allowed to deploy to production
        Pipe-->>Author: Run failed, deployment branch policy violation
    end

    alt Self-approval attempt (separation of duties)
        Author->>Env: Author tries to approve own run
        Env-->>Author: Denied, approver must differ from triggerer
    end

    alt Break-glass emergency approval
        Rev->>Env: Emergency override (incident), full audit record
        Note over Env,Tgt: Override is logged with who, when, and commit,<br/>and alerts are raised for review after the incident.
        Env->>Pipe: Release secrets, resume deploy
        Pipe->>Tgt: Emergency deploy
    end
```

Notes

- The pending deployment holds the run *before* any environment secret is exposed,
  so a rejected or timed-out approval never leaks credentials.
- GitHub Actions models this with required reviewers plus a wait timer; GitLab with
  deployment approvals on a protected environment; Jenkins with an `input` step
  guarding the deploy stage.
- The separation-of-duties check rejects the Author approving their own run even if
  they are otherwise a valid reviewer.
