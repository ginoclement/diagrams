---
title: "IAM Identity Center SSO — Swimlane Diagram"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IAM Identity Center SSO — Swimlane Diagram

One lane per actor. Identity Center authenticates and orchestrates the STS assume into the
permission-set role in the target account.

```mermaid
flowchart TD
    subgraph User
        U1["Open access portal / run aws sso login"]
        U2["Choose account + permission set"]
        U3(["Console or CLI session in account"])
    end

    subgraph Client["Browser/CLI"]
        C1["Authenticate to Identity Center"]
        C2["Request credentials for<br/>(account, permission set)"]
        C3["Receive short-lived credentials"]
    end

    subgraph IC["IAM Identity Center"]
        N1["Verify identity + MFA,<br/>create SSO session"]
        N2["List assigned accounts + permission sets"]
        N3{"Assignment exists for<br/>this account + permission set?"}
        N4["Call STS AssumeRole into<br/>AWSReservedSSO role"]
        N5(["Access denied - no assignment"])
    end

    subgraph STS
        T1["Mint temporary credentials<br/>for permission-set role"]
    end

    subgraph Acct["Target account"]
        A1["Permission-set role<br/>(provisioned from template)"]
    end

    U1 --> C1 --> N1 --> N2 --> U2 --> C2 --> N3
    N3 -->|No| N5
    N3 -->|Yes| A1 --> N4 --> T1 --> C3 --> U3
```

Notes

- The permission-set role in each `Acct` lane is materialized from a single central
  template; account assignment (`N3`) is the authorization gate.
- The external-IdP and CLI device-flow variants change only how the SSO session at `N1` is
  established — see [sequence.md](./sequence.md).
- Every session is short-lived and per (account, permission set); no standing credentials
  live in the account.
