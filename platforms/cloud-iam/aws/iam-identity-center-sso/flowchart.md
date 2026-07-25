---
title: "IAM Identity Center SSO — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IAM Identity Center SSO — Decision Flowchart

Authentication, assignment, and token gates from portal/CLI sign-in to credentials.

```mermaid
flowchart TD
    Start(["User starts sign-in<br/>(portal or aws sso login)"]) --> Src{"Identity source?"}
    Src -->|"Identity Center directory"| AuthN["Authenticate + MFA<br/>at Identity Center"]
    Src -->|"External SAML IdP"| Saml["SAML SSO at corporate IdP"] --> AuthN

    AuthN --> AuthOK{"Credentials + MFA valid?"}
    AuthOK -->|No| ErrAuth(["Deny: authentication failed"])
    AuthOK -->|Yes| Sess["Create SSO session / issue SSO OIDC token"]

    Sess --> Pick["User selects account + permission set"]
    Pick --> Assign{"Account assignment exists<br/>for this principal + permission set?"}
    Assign -->|No| ErrAssign(["Access denied: no assignment"])
    Assign -->|Yes| Tok{"CLI path with SSO token?"}

    Tok -->|Yes| TokValid{"SSO access token valid<br/>and unexpired?"}
    TokValid -->|No| ErrTok(["401: re-run aws sso login"])
    TokValid -->|Yes| Assume
    Tok -->|"No - browser portal"| Assume["STS AssumeRole into<br/>AWSReservedSSO permission-set role"]

    Assume --> Issue(["Return short-lived credentials<br/>(console sign-in or CLI creds)"])
```

Notes

- The identity source only changes the authentication step; assignment and STS assume are
  identical for directory and external-IdP sources.
- Account assignment is the core authorization gate — no assignment, no role, regardless of
  successful authentication.
- The CLI branch adds an SSO-token validity gate; expiry sends the user back through
  `aws sso login`.
