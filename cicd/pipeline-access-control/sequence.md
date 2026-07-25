---
title: "Pipeline Access Control — Sequence Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pipeline Access Control — Sequence Diagram

Happy path first (trusted contributor triggers a run with a least-privilege job token),
then alternates: fork PR from an outside collaborator (reduced token, no secrets),
a manual deployment approval gate, an admin override, and a break-glass elevation.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Contributor
    participant SCM as VCS / SCM
    participant CI as CI/CD system
    participant Tok as Pipeline identity
    actor Appr as Approver

    Dev->>SCM: Push branch / open PR
    SCM->>SCM: Resolve actor role<br/>(Read, Write, Maintain, Admin)
    SCM->>CI: Trigger pipeline (event, ref, actor)
    CI->>CI: Check who may run this ref<br/>(protected pipeline rules)

    alt Trusted contributor (member, Write+)
        CI->>Tok: Mint job token, permissions read-all
        CI->>CI: Elevate per-job only where declared<br/>(e.g. contents write on publish job)
        Tok-->>CI: Scoped token, environment secrets injected
        CI-->>Dev: Run executes, logs streamed
    else Fork PR from outside collaborator
        CI->>CI: Fork context: token read-only,<br/>secrets withheld
        CI-->>Appr: Await "approve and run" from maintainer
        Appr->>CI: Approve run
        CI->>Tok: Mint read-only token (no secrets)
        Tok-->>CI: Build/test only, cannot deploy
    end

    opt Manual deployment gate (protected environment)
        CI-->>Appr: Request approval to deploy to prod
        Note over CI,Appr: Approver must differ from the author,<br/>required reviewers enforced.
        alt Approved by authorized non-author
            Appr->>CI: Approve
            CI->>Tok: Mint prod-scoped identity (separate per env)
            Tok-->>CI: Deploy proceeds
        else Rejected or self-approval attempted
            CI-->>Dev: Deployment denied
        end
    end

    opt Admin override
        Dev->>SCM: Owner/Admin bypasses a protection
        SCM->>SCM: Record override in audit log
        SCM->>CI: Force run / merge
    end

    opt Break-glass elevation (incident)
        Dev->>SCM: Request time-boxed elevation
        SCM->>SCM: Grant scoped role, start TTL, log event
        SCM-->>Dev: Elevated until expiry, auto-revoked
    end
```

Notes

- The role resolution in step 2 is the git-side RBAC; the "who may run this ref" check in
  step 4 is the CI-side protected-pipeline rule. They are enforced separately.
- Least privilege is two moves: the job token starts at `read-all`, then individual jobs
  elevate only the scopes they need (`contents: write`, `packages: write`, `id-token: write`).
- Fork PRs never receive environment secrets or a write token without an explicit maintainer
  approval, which breaks the "malicious PR steals secrets" path.
- Break-glass and admin override both emit audit events; the elevation is time-boxed and
  auto-revoked rather than left standing.
