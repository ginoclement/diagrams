---
title: "Cross-Account Role Assumption — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# Cross-Account Role Assumption — Decision Flowchart

Every gate applied to a cross-account `AssumeRole`, with explicit deny terminals.

```mermaid
flowchart TD
    Start(["Account-A principal calls sts:AssumeRole<br/>on an account-B role"]) --> Ident{"Account-A identity policy allows<br/>sts:AssumeRole on the role ARN?"}
    Ident -->|No| ErrIdent(["AccessDenied: caller identity policy"])
    Ident -->|Yes| Princ{"Account-B trust policy Principal<br/>matches the caller or account A?"}

    Princ -->|No| ErrPrinc(["AccessDenied: not a trusted principal"])
    Princ -->|Yes| Ext{"Trust policy requires<br/>ExternalId?"}

    Ext -->|Yes| ExtMatch{"Supplied ExternalId<br/>matches expected?"}
    ExtMatch -->|No| ErrExt(["AccessDenied: ExternalId mismatch<br/>(confused-deputy blocked)"])
    ExtMatch -->|Yes| Org
    Ext -->|No| Org{"Trust policy requires<br/>aws:PrincipalOrgID?"}

    Org -->|Yes| OrgMatch{"Caller in the trusted org?"}
    OrgMatch -->|No| ErrOrg(["AccessDenied: wrong organization"])
    OrgMatch -->|Yes| Chain
    Org -->|No| Chain{"Caller already using<br/>assumed-role creds?"}

    Chain -->|Yes - chaining| Cap["Cap duration at 3600s"] --> Mint
    Chain -->|No| Mint["Mint temporary credentials in account B"]
    Mint --> Issue(["Return Credentials + SessionToken<br/>+ assumed-role ARN"])
```

Notes

- The identity-policy gate is account A, every other gate is account B — a leak on either side
  breaks cross-account isolation.
- `ExternalId` and `aws:PrincipalOrgID`, when present, are hard gates, not advisory.
- Chaining across a further account re-evaluates trust at each hop and never exceeds 1 hour.
