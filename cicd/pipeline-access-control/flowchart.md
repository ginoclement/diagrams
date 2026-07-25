---
title: "Pipeline Access Control — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Pipeline Access Control — Decision Flowchart

Every gate between "a run is requested" and "code executes with an identity": who may
trigger, whether the run is trusted, what token and secrets it receives, and the approval
gates for deployment. Deny paths terminate explicitly.

```mermaid
flowchart TD
    Start(["Pipeline run requested<br/>(push, PR, manual, schedule)"]) --> Role{"Actor role<br/>sufficient to trigger<br/>this ref?"}
    Role -->|No| DenyTrig(["Deny: insufficient role"])
    Role -->|Yes| Trust{"Trusted context?<br/>(internal branch or<br/>member, not a fork)"}

    Trust -->|"No - fork / outside PR"| ForkAppr{"Maintainer approved<br/>this fork run?"}
    ForkAppr -->|No| Wait(["Held: awaiting approve-and-run"])
    ForkAppr -->|Yes| ForkTok["Read-only token,<br/>no secrets injected"]
    ForkTok --> BuildOnly(["Build / test only,<br/>cannot deploy or publish"])

    Trust -->|Yes| BaseTok["Mint job token:<br/>permissions read-all"]
    BaseTok --> Elev{"Job declares an<br/>elevated scope?"}
    Elev -->|No| RunRead["Run with read-only token"]
    Elev -->|Yes| ElevChk{"Scope justified and<br/>least-privilege?"}
    ElevChk -->|No| DenyScope(["Reject config:<br/>over-broad token"])
    ElevChk -->|Yes| RunElev["Run with per-job elevated scope<br/>(contents write / id-token write)"]

    RunRead --> Gate{"Deployment to a<br/>protected environment?"}
    RunElev --> Gate
    Gate -->|No| Done(["Run completes"])
    Gate -->|Yes| Approve{"Approved by an<br/>authorized reviewer?"}
    Approve -->|"No / rejected"| DenyDeploy(["Deny: deployment blocked"])
    Approve --> Self{"Approver is the<br/>change author?"}
    Self -->|Yes| DenySelf(["Deny: self-approval<br/>not allowed"])
    Self -->|No| EnvId["Assume environment-scoped identity<br/>(separate per env)"]
    EnvId --> Deploy(["Deploy proceeds"])

    %% Break-glass runs parallel to the normal role gate
    Start -.->|"incident"| BG{"Break-glass<br/>elevation requested?"}
    BG -->|Yes| BGok["Grant time-boxed role,<br/>log event, start TTL"]
    BGok -.-> Role
    BGok --> Revoke(["Auto-revoke at expiry"])
```

Notes

- The first gate is git-side role RBAC; the trust check then decides whether the run is a
  fork (untrusted) or internal (trusted) context.
- Least privilege is enforced twice: the base token is `read-all`, and any elevated scope
  must be justified per job (`ElevChk`) — an over-broad request is a config-review reject.
- The deployment gate adds a **human, non-self** approval before an environment-scoped
  identity is assumed, keeping prod credentials off ordinary runs.
- Break-glass is drawn as a dotted side path: it grants a time-boxed role that re-enters the
  normal role gate and auto-revokes at expiry, rather than a standing privilege.
