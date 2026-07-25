---
title: "STS AssumeRole — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# STS AssumeRole — Decision Flowchart

Every gate STS and IAM apply to an `AssumeRole` call, with explicit deny terminals.

```mermaid
flowchart TD
    Start(["Principal calls sts:AssumeRole"]) --> Auth{"Caller already<br/>authenticated to AWS?"}
    Auth -->|No| ErrAuth(["Deny: caller not authenticated"])
    Auth -->|Yes| Ident{"Caller identity policy allows<br/>sts:AssumeRole on this RoleArn?"}

    Ident -->|No| ErrIdent(["AccessDenied: identity policy"])
    Ident -->|Yes| Trust{"Role trust policy Principal<br/>matches the caller?"}

    Trust -->|No| ErrTrust(["AccessDenied: not a trusted principal"])
    Trust -->|Yes| Ext{"Trust policy requires<br/>ExternalId?"}

    Ext -->|Yes| ExtMatch{"Supplied ExternalId<br/>matches expected?"}
    ExtMatch -->|No| ErrExt(["AccessDenied: ExternalId mismatch"])
    ExtMatch -->|Yes| Mfa
    Ext -->|No| Mfa{"Trust policy requires<br/>MFA present?"}

    Mfa -->|Yes| MfaOk{"Valid SerialNumber<br/>+ TokenCode supplied?"}
    MfaOk -->|No| ErrMfa(["AccessDenied: MFA condition unmet"])
    MfaOk -->|Yes| Dur
    Mfa -->|No| Dur{"DurationSeconds within<br/>MaxSessionDuration?"}

    Dur -->|No| ErrDur(["ValidationError: duration too long"])
    Dur -->|Yes| Chain{"Caller already using<br/>assumed-role creds?"}
    Chain -->|Yes - role chaining| Cap["Cap duration at 3600s"] --> Mint
    Chain -->|No| Mint["Mint temporary credentials"]

    Mint --> Sess{"Session policy<br/>provided?"}
    Sess -->|Yes| Inter["Effective perms =<br/>role policy INTERSECT session policy"] --> Issue
    Sess -->|No| Issue(["Return Credentials + SessionToken"])
```

Notes

- The identity-policy gate is the account-A side; the trust-policy gate is the account-B
  side. In single-account use both live in the same account.
- `ExternalId` and MFA are optional conditions but, when present in the trust policy, are
  hard gates.
- A session policy at `Mint` can only intersect (shrink) permissions; it never expands
  beyond the role's own permissions policies.
