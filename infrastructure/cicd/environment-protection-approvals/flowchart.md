---
title: "Environment Protection and Approvals — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Environment Protection and Approvals — Decision Flowchart

Every gate the protected environment applies between a successful build and a live
deploy. Deny and cancel paths terminate explicitly; secrets are released only at the
single node past all gates.

```mermaid
flowchart TD
    S(["Build and test succeed"]) --> Deploy["Deploy job targets<br/>protected environment production"]
    Deploy --> Branch{"Ref allowed by<br/>deployment branch policy?"}
    Branch -->|No| DenyBranch(["Blocked: branch/tag not permitted to deploy"])
    Branch -->|Yes| Pause["Pause run, create pending deployment<br/>(environment secrets withheld)"]

    Pause --> Review{"Required reviewer<br/>decision?"}
    Review -->|Reject| DenyReject(["Cancelled: deployment rejected"])
    Review -->|"No response in window"| DenyTimeout(["Cancelled: approval timed out"])
    Review -->|Approve| SoD{"Approver distinct<br/>from Author?"}

    SoD -->|"No - self approval"| DenySelf(["Denied: separation of duties"])
    SoD -->|Yes| Emergency{"Break-glass<br/>override?"}

    Emergency -->|"Yes - audited"| Audit["Record who / when / commit,<br/>raise alert for post-incident review"]
    Emergency -->|No| Wait{"Wait timer<br/>configured?"}
    Wait -->|Yes| Cool["Hold for cool-off window<br/>(e.g. 30 min)"] --> Release
    Wait -->|No| Release
    Audit --> Release

    Release["Release environment-scoped secrets,<br/>resume deploy job"] --> Run{"Deploy to target<br/>succeeds?"}
    Run -->|No| Fail(["Failed: deploy error, roll back"])
    Run -->|Yes| OK(["Production updated, approval audited"])
```

Notes

- The branch policy gate runs *before* the approval request, so a disallowed ref
  never even pauses for a reviewer.
- `Release` is the only node that exposes environment-scoped secrets; every deny or
  cancel terminal sits upstream of it.
- The break-glass branch still passes through `Release` but writes an audit record and
  raises an alert, unlike the normal approved path.
