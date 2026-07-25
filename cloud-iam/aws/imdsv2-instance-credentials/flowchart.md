---
title: "IMDSv2 Instance Credentials — Decision Flowchart"
creation: 2026-07-25
lastUpdate: 2026-07-25
reviewed: false
deprecated: false
---

# IMDSv2 Instance Credentials — Decision Flowchart

The version/token gates IMDS applies, with explicit deny and 404 terminals. The IMDSv1 branch is
kept only to show the deprecated SSRF-exposed path.

```mermaid
flowchart TD
    Start(["Process on instance needs AWS credentials"]) --> Ver{"Request carries a valid<br/>X-aws-ec2-metadata-token?"}

    Ver -->|No token| Mode{"Instance HttpTokens<br/>setting?"}
    Mode -->|"required (recommended)"| ErrTok(["401 Unauthorized:<br/>IMDSv2 token required"])
    Mode -->|"optional (⛔ IMDSv1 allowed)"| SsrfWarn["IMDSv1 token-less GET<br/>(SSRF exfiltration risk)"] --> Profile

    Ver -->|Valid token| Profile{"Instance profile<br/>attached?"}
    Profile -->|No| Err404(["404 Not Found:<br/>no role on this instance"])
    Profile -->|Yes| Fresh{"Cached credentials<br/>still valid?"}

    Fresh -->|Yes| Return
    Fresh -->|No| Refresh["IMDS asks STS to mint<br/>fresh temporary credentials"] --> Return

    Return(["Return JSON: AccessKeyId,<br/>SecretAccessKey, Token, Expiration"]) --> Sign["App signs API call (SigV4)<br/>with X-Amz-Security-Token"]
    Sign --> Authz{"IAM allows the action?"}
    Authz -->|No| ErrAuthz(["403 AccessDenied"])
    Authz -->|Yes| Ok(["200 result"])
```

Notes

- The left branch is the whole point of IMDSv2: with `HttpTokens=required`, a token-less SSRF
  attempt dead-ends at `401` instead of leaking credentials.
- `HttpPutResponseHopLimit=1` means even a valid token cannot be relayed to a container or peer.
- Refreshing (`Refresh`) is automatic and transparent, the SDK renews before `Expiration`.
